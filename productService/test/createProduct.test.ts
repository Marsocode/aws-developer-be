import { handler } from '../lambda/createProduct';

jest.mock('/opt/nodejs/index', () => ({
  createProduct: jest.fn().mockImplementation(async (product) => ({
    id: '1',
    ...product,
  })),
  updateHeaders: () => ({
    'Access-Control-Allow-Origin': '*',
  }),
  getErrorMessage: (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  },
}));

describe('createProduct', () => {
  it('should create product and return 201', async () => {
    const event = {
      headers: {},

      body: JSON.stringify({
        title: 'Test product',
        description: 'Test description',
        price: 100,
        count: 5,
        image: 'https://test.com/image.png',
      }),
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(201);

    const body = JSON.parse(result.body);

    expect(body.id).toBe('1');
    expect(body.title).toBe('Test product');
    expect(body.price).toBe(100);
    expect(body.count).toBe(5);
  });

  it('should return 400 when body is missing', async () => {
    const event = {
      headers: {},
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body);

    expect(body.message).toBe('Request body is required');
  });

  it('should return 400 when required fields are missing', async () => {
    const event = {
      headers: {},

      body: JSON.stringify({
        description: 'Test description',
      }),
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body);

    expect(body.message).toBe('title, price and count are required');
  });

  it('should return 500 when createProduct throws', async () => {
    const mockedModule = require('/opt/nodejs/index');

    mockedModule.createProduct.mockRejectedValueOnce(new Error('DB error'));

    const event = {
      headers: {},

      body: JSON.stringify({
        title: 'Test product',
        price: 100,
        count: 5,
      }),
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body);

    expect(body.message).toBe('DB error');
  });
});
