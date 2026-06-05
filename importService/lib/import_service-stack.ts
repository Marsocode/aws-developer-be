import * as cdk from 'aws-cdk-lib';
import { Code, Function, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import 'dotenv/config';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucketName = process.env.IMPORT_BUCKET_NAME;

    if (!importBucketName) {
      throw new Error('IMPORT_BUCKET_NAME is not defined');
    }

    const catalogItemsQueueUrl = cdk.Fn.importValue('CatalogItemsQueueUrl');
    const catalogItemsQueueArn = cdk.Fn.importValue('CatalogItemsQueueArn');

    const catalogItemsQueue = sqs.Queue.fromQueueArn(this, 'ImportedCatalogItemsQueue', catalogItemsQueueArn);

    const bucket = new s3.Bucket(this, 'ImportBucket', {
      bucketName: `${importBucketName}-${this.account}-${this.region}`,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const basicAuthorizerArn = cdk.Fn.importValue('BasicAuthorizerArn');

    const basicAuthorizerFunction = Function.fromFunctionAttributes(
      this,
      'ImportedBasicAuthorizer',
      {
        functionArn: basicAuthorizerArn,
        sameEnvironment: true,
      }
    );

    const basicAuthorizer = new apigateway.TokenAuthorizer(this, 'BasicAuthorizer', {
      handler: basicAuthorizerFunction,
      identitySource: apigateway.IdentitySource.header('Authorization'),
      authorizerName: 'basicAuthorizer',
    });

    const commonLayer = new LayerVersion(this, 'CommonLayer', {
      code: Code.fromAsset('../common/dist'),
      compatibleRuntimes: [Runtime.NODEJS_22_X],
      description: 'Shared common code',
    });

    const importProductsFile = new Function(
      this,
      `importProductsFile-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      {
        runtime: Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: Code.fromAsset('lambda/importProductsFile'),
        layers: [commonLayer],
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    const importFileParser = new Function(
      this,
      `importFileParser-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      {
        runtime: Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: Code.fromAsset('lambda/importFileParser'),
        layers: [commonLayer],
        environment: {
          BUCKET_NAME: bucket.bucketName,
          CATALOG_ITEMS_QUEUE_URL: catalogItemsQueueUrl || process.env.CATALOG_ITEMS_QUEUE_URL!,
        },
      }
    );

    catalogItemsQueue.grantSendMessages(importFileParser);

    bucket.grantReadWrite(importProductsFile);
    bucket.grantReadWrite(importFileParser);

    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3Notifications.LambdaDestination(importFileParser), {
      prefix: 'uploaded/',
    });

    const importApi = new apigateway.RestApi(
      this,
      `ImportApi-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      {
        deployOptions: {
          stageName: 'dev',
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
          allowHeaders: ['Content-Type', 'Authorization'],
        },
      }
    );

    importApi.addGatewayResponse('UnauthorizedGatewayResponse', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
      },
    });

    importApi.addGatewayResponse('AccessDeniedGatewayResponse', {
      type: apigateway.ResponseType.ACCESS_DENIED,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
      },
    });

    // GET /import
    const importResource = importApi.root.addResource('import');

    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFile), {
      requestParameters: {
        'method.request.querystring.name': true,
      },
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer: basicAuthorizer,
    });

    new cdk.CfnOutput(this, 'ImportApiUrl', {
      value: importApi.url,
    });
  }
}
