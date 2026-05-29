import * as cdk from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import 'dotenv/config';

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizer: Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const login = process.env.LOGIN;

    if (!login) {
      throw new Error('LOGIN environment variable is required. Add it to .env file.');
    }

    const password = process.env[login];

    if (!password) {
      throw new Error(`Password env variable is not defined`);
    }

    this.basicAuthorizer = new Function(this, 'BasicAuthorizer', {
      functionName: `basicAuthorizer-${this.account}-${this.region}`,
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.resolve(__dirname, '../dist/basicAuthorizer')),
      environment: {
        [login]: password,
      },
    });

    new cdk.CfnOutput(this, 'BasicAuthorizerArn', {
      value: this.basicAuthorizer.functionArn,
      exportName: 'BasicAuthorizerArn',
    });
  }
}
