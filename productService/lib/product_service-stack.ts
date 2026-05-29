import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Code, Function, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as path from 'path';
import { allowedOrigins, TABLES } from '../../common/nodejs/index';
import { CatalogQueueConstruct } from './catalog_queue-stack';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const commonLayer = new LayerVersion(this, 'CommonLayer', {
      code: Code.fromAsset('../common/dist'),
      compatibleRuntimes: [Runtime.NODEJS_22_X],
      description: 'Shared common code',
    });

    const getProductsListFunction = new Function(
      this,
      `getProductsList-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      {
        runtime: Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: Code.fromAsset(path.resolve('lambda/getProductsList')),
        layers: [commonLayer],
      }
    );

    const getProductsByIdFunction = new Function(
      this,
      `getProductsById-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      {
        runtime: Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: Code.fromAsset(path.resolve('lambda/getProductsById')),
        layers: [commonLayer],
      }
    );

    const createProductFunction = new Function(
      this,
      `createProduct-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      {
        runtime: Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: Code.fromAsset(path.resolve('lambda/createProduct')),
        layers: [commonLayer],
      }
    );

    const catalogBatchProcessFunction = new Function(
      this,
      `catalogBatchProcess-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      {
        runtime: Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: Code.fromAsset(path.resolve('lambda/catalogBatchProcess')),
        layers: [commonLayer],
      }
    );

    // API Gateway config
    const productsApi = new apigateway.RestApi(this, 'ProductsApi', {
      restApiName: `ProductsApi-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      deployOptions: {
        stageName: 'dev',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
      },
    });

    // GET /products
    const products = productsApi.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListFunction));

    // GET /products/{productId}
    const productById = products.addResource('{productId}');
    productById.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdFunction));

    // POST /products
    products.addMethod('POST', new apigateway.LambdaIntegration(createProductFunction));

    new cdk.CfnOutput(this, 'ProductsApiUrl', {
      value: productsApi.url,
    });

    /*
    * Below is the code for DynamoDB tables initialization through aws-cdk. 
      But Tables for this task were created using @aws-sdk/client-dynamodb API (see dynamoClient.ts file) in educational purposes
    */
    // const productsTable = new dynamoDb.Table(this, "ProductsTable", {
    //   tableName: "products",
    //   partitionKey: { name: "id", type: dynamoDb.AttributeType.STRING },
    //   billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    // });

    // const stocksTable = new dynamoDb.Table(this, "StocksTable", {
    //   tableName: "stocks",
    //   partitionKey: { name: "product_id", type: dynamoDb.AttributeType.STRING },
    //   billingMode: dynamoDb.BillingMode.PAY_PER_REQUEST,
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    // });

    /*
     *  Describe already created Products and Stocks tables and grand access to Lambda Functions
     */
    const productsTable = dynamoDb.Table.fromTableName(this, TABLES.PRODUCTS, TABLES.PRODUCTS);
    const stocksTable = dynamoDb.Table.fromTableName(this, TABLES.STOCKS, TABLES.STOCKS);

    productsTable.grantReadData(getProductsListFunction);

    productsTable.grantReadData(getProductsByIdFunction);

    productsTable.grantReadWriteData(createProductFunction);

    stocksTable.grantReadData(getProductsListFunction);

    stocksTable.grantReadData(getProductsByIdFunction);

    stocksTable.grantReadWriteData(createProductFunction);

    productsTable.grantWriteData(catalogBatchProcessFunction);
    stocksTable.grantWriteData(catalogBatchProcessFunction);

    // SQS Queue
    const queueConstruct = new CatalogQueueConstruct(this, 'CatalogItemsQueues');

    catalogBatchProcessFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(queueConstruct.catalogItemsQueue, {
        batchSize: 5,
      })
    );

    new cdk.CfnOutput(this, 'CatalogItemsQueueUrl', {
      value: queueConstruct.catalogItemsQueue.queueUrl,
      exportName: 'CatalogItemsQueueUrl',
    });

    new cdk.CfnOutput(this, 'CatalogItemsQueueArn', {
      value: queueConstruct.catalogItemsQueue.queueArn,
      exportName: 'CatalogItemsQueueArn',
    });

    const emailWithImage = process.env.SUBSCRIPTION_EMAIL_BASIC;
    const emailWithoutImage = process.env.SUBSCRIPTION_EMAIL_WITHOUT_IMAGE;

    if (!emailWithImage) {
      throw new Error('SUBSCRIPTION_EMAIL_BASIC is not defined');
    }

    if (!emailWithoutImage) {
      throw new Error('SUBSCRIPTION_EMAIL_WITHOUT_IMAGE is not defined');
    }

    // SNS Topic
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
      topicName: `createProductTopic-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
    });

    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(emailWithImage, {
        filterPolicy: {
          hasImage: sns.SubscriptionFilter.stringFilter({
            allowlist: ['true'],
          }),
        },
      })
    );

    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(emailWithoutImage, {
        filterPolicy: {
          hasImage: sns.SubscriptionFilter.stringFilter({
            allowlist: ['false'],
          }),
        },
      })
    );

    catalogBatchProcessFunction.addEnvironment('CREATE_PRODUCT_TOPIC_ARN', createProductTopic.topicArn);

    createProductTopic.grantPublish(catalogBatchProcessFunction);
  }
}
