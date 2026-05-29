import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CatalogQueueConstruct extends Construct {
  public readonly catalogItemsQueue: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: `catalogItemsQueue-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}`,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
