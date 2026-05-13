import { BatchWriteItemCommand, waitUntilTableExists } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { dynamoClient, createProductsTable, createStocksTable } from '../libs/dynamoClient';
import { InputProduct, ProductWithoutId, products } from './products';
import { getErrorMessage } from '../helpers/errorHandling';

const batchInsert = async (products: InputProduct[]) => {
  const params = {
    RequestItems: {
      products: products.map((product: InputProduct) => ({
        PutRequest: {
          Item: {
            id: { S: `${product.id}` },
            title: { S: `${product.title}` },
            description: { S: `${product.description || ''}` },
            price: { N: `${product.price}` },
            image: { S: `${product.image || ''}` },
            createdAt: { S: new Date().toISOString() },
            updatedAt: { S: new Date().toISOString() },
          },
        },
      })),

      stocks: products.map((product: InputProduct) => ({
        PutRequest: {
          Item: {
            product_id: { S: `${product.id}` },
            count: { N: `${product.count}` },
            createdAt: { S: new Date().toISOString() },
            updatedAt: { S: new Date().toISOString() },
          },
        },
      })),
    },
  };

  try {
    const data = await dynamoClient.send(new BatchWriteItemCommand(params));

    console.log('Products and stocks seeded', data);
  } catch (error) {
    console.error(getErrorMessage(error, 'Error while adding products and stocks'));
  }
};

const seedDbWithData = async () => {
  try {
    await createProductsTable();
  } catch (error) {
    console.error('Products table already exists');
  }

  try {
    await createStocksTable();
  } catch (error) {
    console.error('Stocks table already exists');
  }

  await Promise.all([
    waitUntilTableExists({ client: dynamoClient, maxWaitTime: 30 }, { TableName: 'products' }),
    waitUntilTableExists({ client: dynamoClient, maxWaitTime: 30 }, { TableName: 'stocks' }),
  ]);

  const productsWithIds = products.map((product: ProductWithoutId) => ({
    ...product,
    id: uuidv4(),
  }));

  try {
    await batchInsert(productsWithIds);
  } catch (error) {
    console.error(getErrorMessage(error, 'Batch products insert failed'));
  }
};

seedDbWithData();
