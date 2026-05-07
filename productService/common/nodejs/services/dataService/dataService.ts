import { GetCommand, ScanCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

import { docClient } from '../../libs/dynamoClient';
import { InputProduct, Product } from '../../data/products';
import { getErrorMessage } from '../../helpers/errorHandling';
import { TABLES } from '../../constants';

export const createProduct = async (body: InputProduct): Promise<Product> => {
  try {
    const productId = uuidv4();
    const now = new Date().toISOString();

    const params = {
      TransactItems: [
        {
          Put: {
            TableName: TABLES.PRODUCTS,
            Item: {
              id: productId,
              title: body.title,
              description: body.description || '',
              price: body.price,
              image: body.image || '',
              createdAt: now,
              updatedAt: now,
            },
          },
        },
        {
          Put: {
            TableName: TABLES.STOCKS,
            Item: {
              product_id: productId,
              count: body.count,
              createdAt: now,
              updatedAt: now,
            },
          },
        },
      ],
    };

    await docClient.send(new TransactWriteCommand(params));

    console.log('Product created successfully');

    return {
      id: productId,
      ...body,
    };
  } catch (error) {
    console.error(getErrorMessage(error));
    throw error;
  }
};

export const getProductsList = async () => {
  try {
    const [productsResponse, stocksResponse] = await Promise.all([
      docClient.send(
        new ScanCommand({
          TableName: TABLES.PRODUCTS,
        })
      ),

      docClient.send(
        new ScanCommand({
          TableName: TABLES.STOCKS,
        })
      ),
    ]);

    const products = productsResponse.Items || [];
    const stocks = stocksResponse.Items || [];

    const stocksMap = new Map(stocks.map((stock) => [stock.product_id, stock]));

    return products.map((product) => ({
      ...product,
      count: stocksMap.get(product.id)?.count || 0,
    }));
  } catch (error) {
    console.error(getErrorMessage(error));

    throw error;
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const [productResponse, stockResponse] = await Promise.all([
      docClient.send(
        new GetCommand({
          TableName: TABLES.PRODUCTS,
          Key: { id },
        })
      ),

      docClient.send(
        new GetCommand({
          TableName: TABLES.STOCKS,
          Key: {
            product_id: id,
          },
        })
      ),
    ]);

    if (!productResponse.Item) {
      return null;
    }

    return {
      ...productResponse.Item,
      count: stockResponse.Item?.count || 0,
    } as Product;
  } catch (error) {
    console.error(getErrorMessage(error));

    throw error;
  }
};
