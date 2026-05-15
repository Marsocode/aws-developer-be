import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getErrorMessage } from '../helpers/errorHandling';

const EXPIRING_TIME = 60 * 5;

export const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' });

const UPLOADED_PREFIX = 'uploaded';

export const s3CreatePutSignedUrl = async (filename: string, bucketName = '') => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName || process.env.BUCKET_NAME,
      Key: `${UPLOADED_PREFIX}/${filename}`,
      ContentType: 'text/csv',
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRING_TIME,
    });

    return signedUrl;
  } catch (error) {
    console.error(getErrorMessage(error));
    throw error;
  }
};

export const s3GetObject = async (bucketName: string, objectKey: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    return s3Client.send(command);
  } catch (error) {
    console.error(getErrorMessage(error));
    throw error;
  }
};

export const s3CopyObject = async (bucketName: string, sourceKey: string, destinationKey: string) => {
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey,
    })
  );
};

export const s3DeleteObject = async (bucketName: string, objectKey: string) => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    })
  );
};
