export interface InputProduct {
  id?: string;
  title: string;
  description?: string;
  price: number;
  count: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  count: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductWithoutId = Omit<Product, 'id'>;

export const products = [
  {
    title: 'Vintage Camera',
    description: 'Classic film camera for photography enthusiasts.',
    price: 120,
    image: 'https://picsum.photos/id/1011/200/300',
    count: 5,
  },
  {
    title: 'Wireless Headphones',
    description: 'Noise-cancelling over-ear headphones with deep bass.',
    price: 85,
    image: 'https://picsum.photos/id/180/200/300',
    count: 10,
  },
  {
    title: 'Smart Watch',
    description: 'Modern smartwatch with fitness tracking features.',
    price: 150,
    image: 'https://picsum.photos/id/1062/200/300',
    count: 10,
  },
  {
    title: 'Running Sneakers',
    description: 'Lightweight sneakers designed for everyday running.',
    price: 70,
    image: 'https://picsum.photos/id/21/200/300',
    count: 5,
  },
  {
    title: 'Backpack',
    description: 'Durable backpack suitable for travel and daily use.',
    price: 60,
    image: 'https://picsum.photos/id/29/200/300',
    count: 2,
  },
];
