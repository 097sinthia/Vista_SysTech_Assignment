import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { Product } from '../models/Product';

describe('Catalog API', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/headless-ecommerce-test';
    await mongoose.connect(mongoURI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await Product.deleteMany({});
  });

  describe('GET /api/catalog/products', () => {
    it('should return empty products list when no products exist', async () => {
      const response = await request(app)
        .get('/api/catalog/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should return products with pagination', async () => {
      // Create test products
      const testProducts = [
        {
          name: 'Test Product 1',
          description: 'Test Description 1',
          category: 'Electronics',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 1',
            sku: 'TEST-001',
            price: 100,
            stock: 10
          }],
          isActive: true
        },
        {
          name: 'Test Product 2',
          description: 'Test Description 2',
          category: 'Clothing',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 2',
            sku: 'TEST-002',
            price: 50,
            stock: 20
          }],
          isActive: true
        }
      ];

      await Product.insertMany(testProducts);

      const response = await request(app)
        .get('/api/catalog/products?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });

    it('should filter products by category', async () => {
      const testProducts = [
        {
          name: 'Electronics Product',
          description: 'Electronics Description',
          category: 'Electronics',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 1',
            sku: 'TEST-001',
            price: 100,
            stock: 10
          }],
          isActive: true
        },
        {
          name: 'Clothing Product',
          description: 'Clothing Description',
          category: 'Clothing',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 2',
            sku: 'TEST-002',
            price: 50,
            stock: 20
          }],
          isActive: true
        }
      ];

      await Product.insertMany(testProducts);

      const response = await request(app)
        .get('/api/catalog/products?category=Electronics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].category).toBe('Electronics');
    });

    it('should filter products by price range', async () => {
      const testProducts = [
        {
          name: 'Expensive Product',
          description: 'Expensive Description',
          category: 'Electronics',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 1',
            sku: 'TEST-001',
            price: 500,
            stock: 10
          }],
          isActive: true
        },
        {
          name: 'Cheap Product',
          description: 'Cheap Description',
          category: 'Clothing',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 2',
            sku: 'TEST-002',
            price: 50,
            stock: 20
          }],
          isActive: true
        }
      ];

      await Product.insertMany(testProducts);

      const response = await request(app)
        .get('/api/catalog/products?minPrice=100&maxPrice=600')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Expensive Product');
    });

    it('should search products by text', async () => {
      const testProducts = [
        {
          name: 'Wireless Headphones',
          description: 'High-quality wireless headphones',
          category: 'Electronics',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 1',
            sku: 'TEST-001',
            price: 100,
            stock: 10
          }],
          tags: ['wireless', 'audio'],
          isActive: true
        },
        {
          name: 'T-Shirt',
          description: 'Cotton t-shirt',
          category: 'Clothing',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 2',
            sku: 'TEST-002',
            price: 50,
            stock: 20
          }],
          tags: ['cotton', 'clothing'],
          isActive: true
        }
      ];

      await Product.insertMany(testProducts);

      const response = await request(app)
        .get('/api/catalog/search?q=wireless')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Wireless Headphones');
    });
  });

  describe('GET /api/catalog/products/:id', () => {
    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/catalog/products/${fakeId}`)
        .expect(404);
    });

    it('should return product by ID', async () => {
      const testProduct = {
        name: 'Test Product',
        description: 'Test Description',
        category: 'Electronics',
        brand: 'TestBrand',
        variants: [{
          name: 'Variant 1',
          sku: 'TEST-001',
          price: 100,
          stock: 10
        }],
        isActive: true
      };

      const product = await Product.create(testProduct);

      const response = await request(app)
        .get(`/api/catalog/products/${product._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Product');
      expect(response.body.data.variants).toHaveLength(1);
    });

    it('should return 400 for invalid ObjectId', async () => {
      await request(app)
        .get('/api/catalog/products/invalid-id')
        .expect(400);
    });
  });

  describe('GET /api/catalog/categories', () => {
    it('should return all categories', async () => {
      const testProducts = [
        {
          name: 'Product 1',
          description: 'Description 1',
          category: 'Electronics',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 1',
            sku: 'TEST-001',
            price: 100,
            stock: 10
          }],
          isActive: true
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          category: 'Clothing',
          brand: 'TestBrand',
          variants: [{
            name: 'Variant 2',
            sku: 'TEST-002',
            price: 50,
            stock: 20
          }],
          isActive: true
        }
      ];

      await Product.insertMany(testProducts);

      const response = await request(app)
        .get('/api/catalog/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('Electronics');
      expect(response.body.data).toContain('Clothing');
    });
  });

  describe('GET /api/catalog/brands', () => {
    it('should return all brands', async () => {
      const testProducts = [
        {
          name: 'Product 1',
          description: 'Description 1',
          category: 'Electronics',
          brand: 'Brand1',
          variants: [{
            name: 'Variant 1',
            sku: 'TEST-001',
            price: 100,
            stock: 10
          }],
          isActive: true
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          category: 'Clothing',
          brand: 'Brand2',
          variants: [{
            name: 'Variant 2',
            sku: 'TEST-002',
            price: 50,
            stock: 20
          }],
          isActive: true
        }
      ];

      await Product.insertMany(testProducts);

      const response = await request(app)
        .get('/api/catalog/brands')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('Brand1');
      expect(response.body.data).toContain('Brand2');
    });
  });
});
