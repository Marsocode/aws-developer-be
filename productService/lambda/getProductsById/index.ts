import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { getProductById, updateHeaders, getErrorMessage } from '/opt/nodejs/index';

export const handler = async (event: APIGatewayProxyEventV2) => {
  const { pathParameters, headers } = event;

  console.log('getProductsById Incoming event:', JSON.stringify(event));

  try {
    if (!pathParameters || !pathParameters.productId) {
      return {
        statusCode: 400,
        headers: updateHeaders(headers),
        body: JSON.stringify({
          message: 'Bad Request. The ProductId parameter is required.',
        }),
      };
    }

    const product = await getProductById(pathParameters.productId);

    if (!product) {
      return {
        statusCode: 404,
        headers: updateHeaders(headers),
        body: JSON.stringify({ message: 'Product Not Found' }),
      };
    }

    return {
      statusCode: 200,
      headers: updateHeaders(headers),
      body: JSON.stringify(product),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: updateHeaders(headers),
      body: JSON.stringify({
        message: getErrorMessage(error),
      }),
    };
  }
};
