import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Code, Function, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { allowedOrigins, TABLES } from '../common/nodejs/constants';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const commonLayer = new LayerVersion(this, 'CommonLayer', {
      code: Code.fromAsset(path.resolve('dist/layer')),
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
  }
}
