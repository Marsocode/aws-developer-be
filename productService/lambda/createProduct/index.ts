import { APIGatewayProxyEventV2 } from 'aws-lambda';

import { createProduct, updateHeaders, getErrorMessage, InputProduct } from '/opt/nodejs/index';

export const handler = async (event: APIGatewayProxyEventV2) => {
  const { headers, body } = event;

  console.log('CreateProduct Incoming event:', JSON.stringify(event));

  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: updateHeaders(headers),
        body: JSON.stringify({
          message: 'Request body is required',
        }),
      };
    }

    const parsedBody: InputProduct = JSON.parse(body);

    const { title, description, price, count, image } = parsedBody;

    if (!title || price == null || count == null) {
      return {
        statusCode: 400,
        headers: updateHeaders(headers),
        body: JSON.stringify({
          message: 'title, price and count are required',
        }),
      };
    }

    const product = await createProduct({
      title,
      description,
      price,
      count,
      image,
    });

    return {
      statusCode: 201,
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
