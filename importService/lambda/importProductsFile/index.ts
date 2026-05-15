import { APIGatewayProxyHandler } from 'aws-lambda';
import { s3CreatePutSignedUrl, getErrorMessage } from '/opt/nodejs/index';

export const handler: APIGatewayProxyHandler = async (event: any) => {
  try {
    const fileName = event.queryStringParameters?.name;

    console.log('Incoming fileName', fileName);

    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'File name is required',
        }),
      };
    }

    const signedUrl = await s3CreatePutSignedUrl(fileName, process.env.BUCKET_NAME);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ signedUrl: signedUrl }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: getErrorMessage(error),
      }),
    };
  }
};
