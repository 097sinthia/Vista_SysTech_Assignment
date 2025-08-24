import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { productQuerySchema, ProductQuery } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * /api/catalog/products:
 *   get:
 *     summary: Get products with filtering and pagination
 *     tags: [Catalog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product name, description, and tags
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of products with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validatedQuery = productQuerySchema.parse(req.query);
    
    // Get products using aggregation pipeline
    const result = await Product.getProductsWithAggregation(validatedQuery);
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    }
    
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

/**
 * @swagger
 * /api/catalog/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }
    
    // Get product using aggregation pipeline
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    const products = await Product.getProductById(id);
    
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    return res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

/**
 * @swagger
 * /api/catalog/categories:
 *   get:
 *     summary: Get all product categories
 *     tags: [Catalog]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category' } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, category: '$_id' } }
    ]);
    
    return res.json({
      success: true,
      data: categories.map(cat => cat.category)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * @swagger
 * /api/catalog/brands:
 *   get:
 *     summary: Get all product brands
 *     tags: [Catalog]
 *     responses:
 *       200:
 *         description: List of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/brands', async (req: Request, res: Response) => {
  try {
    const brands = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brand' } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, brand: '$_id' } }
    ]);
    
    return res.json({
      success: true,
      data: brands.map(brand => brand.brand)
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch brands'
    });
  }
});

/**
 * @swagger
 * /api/catalog/search:
 *   get:
 *     summary: Search products
 *     tags: [Catalog]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Missing search query
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const pipeline: any[] = [
      {
        $match: {
          isActive: true,
          $text: { $search: q }
        }
      },
      {
        $addFields: {
          score: { $meta: 'textScore' },
          minPrice: { $min: '$variants.price' },
          maxPrice: { $max: '$variants.price' },
          totalStock: { $sum: '$variants.stock' }
        }
      },
      { $sort: { score: { $meta: 'textScore' } } },
      {
        $facet: {
          products: [
            { $skip: skip },
            { $limit: Number(limit) }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];
    
    const result = await Product.aggregate(pipeline);
    
    return res.json({
      success: true,
      data: {
        products: result[0]?.products || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result[0]?.totalCount[0]?.count || 0,
          totalPages: Math.ceil((result[0]?.totalCount[0]?.count || 0) / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

export default router;
