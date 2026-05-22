import { handler } from '../lambda/importProductsFile/index';

jest.mock('/opt/nodejs/index', () => ({
  s3CreatePutSignedUrl: jest.fn(),
  s3GetObject: jest.fn(),
  updateHeaders: jest.fn(() => ({
    'Access-Control-Allow-Origin': '*',
  })),
  getErrorMessage: jest.fn((error) => error.message),
}));

import { s3CreatePutSignedUrl } from '/opt/nodejs/index';

describe('importProductsFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when name query parameter is missing', async () => {
    const result = await handler(
      {
        queryStringParameters: {},
      } as any,
      {} as any,
      jest.fn()
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse(result?.body || '{}')).toEqual({
      message: 'File name is required',
    });
  });

  it('should return signed URL when name is provided', async () => {
    (s3CreatePutSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com');

    const result = await handler(
      {
        queryStringParameters: {
          name: 'products.csv',
        },
      } as any,
      {} as any,
      jest.fn()
    );

    expect(s3CreatePutSignedUrl).toHaveBeenCalledWith('products.csv');
    expect(result?.statusCode).toBe(200);
    expect(result?.body).toBe('https://signed-url.com');
  });
});
