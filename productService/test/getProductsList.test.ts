import { handler } from '../lambda/getProductsList';

// mock layer imports
jest.mock('/opt/nodejs/products', () => ({
  products: [
    { id: '1', title: 'Test product', price: 100 }
  ]
}));

jest.mock('/opt/nodejs/updateHeaders', () => ({
  updateHeaders: () => ({ 'Access-Control-Allow-Origin': '*' })
}));

describe('getProductsList Lambda', () => {
  it('should return products list', async () => {
    const event = {
      headers: {}
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);

    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('1');
  });
});