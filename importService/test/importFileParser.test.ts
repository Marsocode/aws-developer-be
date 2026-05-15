import { Readable } from 'stream';

import { handler } from '../lambda/importFileParser/index';

jest.mock('/opt/nodejs/index', () => ({
  s3GetObject: jest.fn(),
  s3CopyObject: jest.fn(),
  s3DeleteObject: jest.fn(),
  parseCsvStream: jest.fn(),
  getErrorMessage: jest.fn((error) => error.message),
}));

import { s3GetObject, s3CopyObject, s3DeleteObject, parseCsvStream } from '/opt/nodejs/index';

describe('importFileParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses file and moves it from uploaded to parsed folder', async () => {
    const mockStream = new Readable({
      read() {},
    });

    (s3GetObject as jest.Mock).mockResolvedValue({
      Body: mockStream,
    });

    (parseCsvStream as jest.Mock).mockResolvedValue(undefined);

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/products.csv',
            },
          },
        },
      ],
    };

    await handler(event as any, {} as any, jest.fn());

    expect(s3GetObject).toHaveBeenCalledWith('test-bucket', 'uploaded/products.csv');

    expect(parseCsvStream).toHaveBeenCalledWith(mockStream);

    expect(s3CopyObject).toHaveBeenCalledWith('test-bucket', 'uploaded/products.csv', 'parsed/products.csv');

    expect(s3DeleteObject).toHaveBeenCalledWith('test-bucket', 'uploaded/products.csv');
  });

  it('decodes object key before processing and moving file', async () => {
    const mockStream = new Readable({
      read() {},
    });

    (s3GetObject as jest.Mock).mockResolvedValue({
      Body: mockStream,
    });

    (parseCsvStream as jest.Mock).mockResolvedValue(undefined);

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/my+products%20file.csv',
            },
          },
        },
      ],
    };

    await handler(event as any, {} as any, jest.fn());

    expect(s3GetObject).toHaveBeenCalledWith('test-bucket', 'uploaded/my products file.csv');

    expect(parseCsvStream).toHaveBeenCalledWith(mockStream);

    expect(s3CopyObject).toHaveBeenCalledWith(
      'test-bucket',
      'uploaded/my products file.csv',
      'parsed/my products file.csv'
    );

    expect(s3DeleteObject).toHaveBeenCalledWith('test-bucket', 'uploaded/my products file.csv');
  });

  it('throws when s3GetObject fails', async () => {
    (s3GetObject as jest.Mock).mockRejectedValue(new Error('S3 error'));

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'uploaded/products.csv',
            },
          },
        },
      ],
    };

    await expect(handler(event as any, {} as any, jest.fn())).rejects.toThrow('S3 error');

    expect(parseCsvStream).not.toHaveBeenCalled();
    expect(s3CopyObject).not.toHaveBeenCalled();
    expect(s3DeleteObject).not.toHaveBeenCalled();
  });
});
