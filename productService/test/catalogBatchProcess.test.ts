import { handler } from '../lambda/catalogBatchProcess/index';

jest.mock('/opt/nodejs/index', () => ({
  createProduct: jest.fn(),
  publishMessageToSNSTopic: jest.fn(),
  getErrorMessage: jest.fn((error) => error.message),
}));

import { createProduct, publishMessageToSNSTopic } from '/opt/nodejs/index';

describe('catalogBatchProcess', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      ...OLD_ENV,
      CREATE_PRODUCT_TOPIC_ARN: 'test-topic-arn',
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('creates products from SQS messages and publishes SNS notification', async () => {
    const product1 = {
      title: 'Product 1',
      description: 'Description 1',
      price: 100,
      count: 5,
    };

    const product2 = {
      title: 'Product 2',
      description: 'Description 2',
      price: 200,
      count: 3,
    };

    const event = {
      Records: [{ body: JSON.stringify(product1) }, { body: JSON.stringify(product2) }],
    };

    await handler(event as any, {} as any, jest.fn());

    expect(createProduct).toHaveBeenCalledTimes(2);
    expect(createProduct).toHaveBeenNthCalledWith(1, product1);
    expect(createProduct).toHaveBeenNthCalledWith(2, product2);

    expect(publishMessageToSNSTopic).toHaveBeenCalledWith(
      'test-topic-arn',
      {
        message: 'Products were created successfully',
        products: [product1, product2],
      },
      'Products creation notification'
    );
  });

  it('throws when CREATE_PRODUCT_TOPIC_ARN is missing', async () => {
    delete process.env.CREATE_PRODUCT_TOPIC_ARN;

    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Product 1',
            price: 100,
            count: 5,
          }),
        },
      ],
    };

    await expect(handler(event as any, {} as any, jest.fn())).rejects.toThrow(
      'CREATE_PRODUCT_TOPIC_ARN is not defined'
    );

    expect(createProduct).not.toHaveBeenCalled();
    expect(publishMessageToSNSTopic).not.toHaveBeenCalled();
  });

  it('throws when createProduct fails and does not publish SNS notification', async () => {
    (createProduct as jest.Mock).mockRejectedValue(new Error('Create product failed'));

    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Broken product',
            price: 10,
            count: 1,
          }),
        },
      ],
    };

    await expect(handler(event as any, {} as any, jest.fn())).rejects.toThrow('Create product failed');

    expect(publishMessageToSNSTopic).not.toHaveBeenCalled();
  });
});
