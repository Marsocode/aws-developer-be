#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AuthorizationServiceStack } from '../lib/authorization_service-stack';
import 'dotenv/config';

const app = new cdk.App();
new AuthorizationServiceStack(app, 'AuthorizationServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
