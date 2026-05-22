import { SQSHandler } from 'aws-lambda';

import { createProduct, publishMessageToSNSTopic, getErrorMessage, InputProduct } from '/opt/nodejs/index';

export const handler: SQSHandler = async (event) => {
  try {
    console.log('catalogBatchProcess event:', JSON.stringify(event));

    const topicArn = process.env.CREATE_PRODUCT_TOPIC_ARN;

    if (!topicArn) {
      throw new Error('CREATE_PRODUCT_TOPIC_ARN is not defined');
    }

    const addedProducts: InputProduct[] = [];

    for (const record of event.Records) {
      const product = JSON.parse(record.body) as InputProduct;

      await createProduct(product);

      addedProducts.push(product);

      console.log('Product created from SQS:', product);
    }

    await publishMessageToSNSTopic(
      topicArn,
      {
        message: 'Products were created successfully',
        products: addedProducts,
      },
      'Products creation notification',
      {
        hasImage: addedProducts.some((p) => p.image) ? 'true' : 'false',
      }
    );
  } catch (error) {
    console.error(getErrorMessage(error));
    throw error;
  }
};
