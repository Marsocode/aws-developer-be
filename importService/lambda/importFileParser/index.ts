import { S3Handler, S3Event } from 'aws-lambda';
import { s3GetObject, s3CopyObject, s3DeleteObject, getErrorMessage, parseCsvStream } from '/opt/nodejs/index';

const PARSED_PREFIX = 'parsed';

export const handler: S3Handler = async (event: S3Event) => {
  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      const response = await s3GetObject(bucketName, objectKey);

      const stream = response.Body as NodeJS.ReadableStream;

      await parseCsvStream(stream);

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
