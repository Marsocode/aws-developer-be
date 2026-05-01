import { APIGatewayProxyEventV2 } from 'aws-lambda';

import { products } from '/opt/nodejs/products';
import { updateHeaders } from '/opt/nodejs/updateHeaders';

export const handler = async (event: APIGatewayProxyEventV2) => {
  const { headers } = event;

  return {
    statusCode: 200,
    headers: updateHeaders(headers),
    body: JSON.stringify(products),
  };
}
