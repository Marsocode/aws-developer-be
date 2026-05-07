import { DynamoDBClient, CreateTableCommand, CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getErrorMessage } from '../helpers/errorHandling';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const createProductsTable = async () => {
  try {
    const params: CreateTableCommandInput = {
      TableName: 'products',
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],

      BillingMode: 'PAY_PER_REQUEST',
    };

    const response = await dynamoClient.send(new CreateTableCommand(params));

    console.log(response);
  } catch (error) {
    console.error(getErrorMessage(error));
  }
};

const createStocksTable = async () => {
  try {
    const params: CreateTableCommandInput = {
      TableName: 'stocks',
      AttributeDefinitions: [
        {
          AttributeName: 'product_id',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'product_id',
          KeyType: 'HASH',
        },
      ],

      BillingMode: 'PAY_PER_REQUEST',
    };

    const response = await dynamoClient.send(new CreateTableCommand(params));

    console.log(response);
  } catch (error) {
    console.error(getErrorMessage(error));
  }
};

export { dynamoClient, docClient, createProductsTable, createStocksTable };
