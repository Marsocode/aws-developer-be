import { S3Handler, S3Event } from 'aws-lambda';
import {
  s3GetObject,
  s3CopyObject,
  s3DeleteObject,
  getErrorMessage,
  parseCsvStream,
  sendMessageToQueue,
} from '/opt/nodejs/index';

const PARSED_PREFIX = 'parsed';

export const handler: S3Handler = async (event: S3Event) => {
  try {
    const queueUrl = process.env.CATALOG_ITEMS_QUEUE_URL;

    if (!queueUrl) {
      throw new Error('CATALOG_ITEMS_QUEUE_URL is not defined');
    }

    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      const response = await s3GetObject(bucketName, objectKey);

      const stream = response.Body as NodeJS.ReadableStream;

      const parsedRecords = await parseCsvStream(stream);

      for (const record of parsedRecords) {
        await sendMessageToQueue(queueUrl, record);
        console.log('Record successfully sent to SQS');
      }

      const parsedKey = objectKey.replace(/^uploaded\//, `${PARSED_PREFIX}/`);

      await s3CopyObject(bucketName, objectKey, parsedKey);
      await s3DeleteObject(bucketName, objectKey);

      console.log(`File moved from ${objectKey} to ${parsedKey}`);
    }
  } catch (error) {
    console.error(getErrorMessage(error));
    throw error;
  }
};
