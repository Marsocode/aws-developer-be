import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Code, Function, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import * as apigateway  from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { allowedOrigins } from '../common/nodejs/constants';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const commonLayer = new LayerVersion(this, 'CommonLayer', {
      code: Code.fromAsset(path.resolve('dist/layer')),
      compatibleRuntimes: [Runtime.NODEJS_22_X],
      description: 'Shared common code',
    });

    const getProductsListFunction = new Function(this, `getProductsList-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`, {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.resolve('lambda/getProductsList')),
      layers: [commonLayer],
    });


    const getProductsByIdFunction = new Function(this, `getProductsById-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`, {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.resolve('lambda/getProductsById')),
      layers: [commonLayer],
    });

    // API Gateway config
    const productsApi = new apigateway.RestApi(this, 'ProductsApi', {
      restApiName:  `ProductsApi-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      deployOptions: {
        stageName: 'dev',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: ['GET', 'OPTIONS']
      },
    });
    
    // GET /products
    const products = productsApi.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListFunction))

    // GET /products/{productId}
    const productById = products.addResource('{productId}');
    productById.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getProductsByIdFunction)
    );

    new cdk.CfnOutput(this, 'ProductsApiUrl', {
      value: productsApi.url,
    });

  }
}
