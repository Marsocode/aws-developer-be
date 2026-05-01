import { handler } from '../lambda/getProductsById';

// mock layer modules
jest.mock('/opt/nodejs/products', () => ({
  products: [
    { id: '1', title: 'Test product', price: 100 },
    { id: '2', title: 'Test product 2', price: 50 }
  ],
}));

jest.mock('/opt/nodejs/updateHeaders', () => ({
  updateHeaders: () => ({ 'Access-Control-Allow-Origin': '*' }),
}));

describe('getProductsById ', () => {
  it('should return product when found with statusCode 200', async () => {
    const event = {
      pathParameters: { productId: '1' },
      headers: {},
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.id).toBe('1');
    expect(body.title).toBe('Test product');
  });

  it('should return 404 when product not found', async () => {
    const event = {
      pathParameters: { productId: '666' },
      headers: {},
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(404);

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Product Not Found');
  });

  it('should return 400 when productId is missing', async () => {
    const event = {
      pathParameters: {}, // no productId
      headers: {},
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);

    const body = JSON.parse(result.body);
    expect(body.message).toContain('ProductId');
  });
});