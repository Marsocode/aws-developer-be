import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';

const generatePolicy = (
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  },
});

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const authToken = event.authorizationToken;
  if (!authToken) {
    throw new Error('Unauthorized');
  }

  const [authType, encodedCredentials] = authToken.split(' ');

  if (authType !== 'Basic' || !encodedCredentials) {
    return generatePolicy('user', 'Deny', event.methodArn);
  }

  const processedCreds = Buffer.from(encodedCredentials, 'base64').toString('utf-8');

  const [login, password] = processedCreds.split(':');

  const expectedPassword = process.env[login];

  if (!expectedPassword || expectedPassword !== password) {
    return generatePolicy(login || 'user', 'Deny', event.methodArn);
  }

  return generatePolicy(login, 'Allow', event.methodArn);
};
