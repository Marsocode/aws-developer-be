import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

import { getErrorMessage } from '../helpers/errorHandling';

export const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const sendMessageToQueue = async (queueUrl: string, messageBody: unknown): Promise<void> => {
  try {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
    });

    await sqsClient.send(command);
  } catch (error) {
    console.error(getErrorMessage(error));
    throw error;
  }
};
