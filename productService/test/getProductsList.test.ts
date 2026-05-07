import { handler } from '../lambda/getProductsList';

// mock layer imports

jest.mock('/opt/nodejs/index', () => ({
  getProductsList: jest.fn().mockResolvedValue([
    {
      id: '1',
      title: 'Test product',
      price: 100,
    },
  ]),

  getProductById: jest.fn().mockImplementation(async (id: string) => {
    const products = [
      {
        id: '1',
        title: 'Test product',
        price: 100,
      },
      {
        id: '2',
        title: 'Test product 2',
        price: 50,
      },
    ];

    return products.find((p) => p.id === id) || null;
  }),

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

describe('getProductsList Lambda', () => {
  it('should return products list', async () => {
    const event = {
      headers: {},
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);

    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('1');
  });
});
