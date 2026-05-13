# This repository represents the backend part of NodejsAWSShopReact application

## Product Service API

A simple serverless backend built with AWS Lambda and API Gateway and DynamoDB that provides products data via REST endpoints.

### Endpoints

- Get list of products
- Get product by ID
- Create a product

### Features

- Serverless architecture (AWS Lambda)
- API Gateway integration
- DynamoDB for storing entities
- Shared code via Lambda Layers
- Lambda functions are Unit tested with Jest

## Useful commands

* `npm run build:all`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
