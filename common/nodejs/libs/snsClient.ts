import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

import { getErrorMessage } from '../helpers/errorHandling';

export const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const publishMessageToSNSTopic = async (
  topicArn: string,
  message: unknown,
  subject = 'Notification',
  attributes?: Record<string, string>
): Promise<void> => {
  try {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Subject: subject,
      Message: JSON.stringify(message, null, 2),
      MessageAttributes: attributes
        ? Object.fromEntries(
            Object.entries(attributes).map(([key, value]) => [
              key,
              {
                DataType: 'String',
                StringValue: value,
              },
            ])
          )
        : undefined,
    });

    await snsClient.send(command);
  } catch (error) {
    console.error(getErrorMessage(error));
    throw error;
  }
};
