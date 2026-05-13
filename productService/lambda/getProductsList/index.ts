import { APIGatewayProxyEventV2 } from 'aws-lambda';

import { getProductsList, updateHeaders, getErrorMessage } from '/opt/nodejs/index';

export const handler = async (event: APIGatewayProxyEventV2) => {
  const { headers } = event;

  console.log('getProductsList Incoming event:', JSON.stringify(event));

  try {
    const products = await getProductsList();

    return {
      statusCode: 200,
      headers: updateHeaders(headers),
      body: JSON.stringify(products),
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
