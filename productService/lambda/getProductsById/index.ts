import { APIGatewayProxyEventV2 } from 'aws-lambda';

import { products } from '/opt/nodejs/products';
import { updateHeaders } from '/opt/nodejs/updateHeaders';

export const handler = async (event: APIGatewayProxyEventV2) => {
  const { pathParameters, headers } = event;

  if (pathParameters && !pathParameters.productId) {
    return {
      statusCode: 400,
      headers: updateHeaders(headers),
      body: JSON.stringify({ message: 'Bad Request. The ProductId parameter is required.' })
    }
  }

  const product = products.find(product => product.id === pathParameters?.productId);

  if (!product) {
    return {
      statusCode: 404,
      headers: updateHeaders(headers),
      body: JSON.stringify({ message: 'Product Not Found' })
    }
  }

  return {
    statusCode: 200,
    headers: updateHeaders(headers),
    body: JSON.stringify(product),
  };
}