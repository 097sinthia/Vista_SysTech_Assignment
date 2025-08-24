import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PromoCode } from '../models/PromoCode';
import { promoCodeSchema, PromoCodeInput } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * /api/promos:
 *   get:
 *     summary: Get promo codes with filtering and pagination
 *     tags: [Promos]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [percentage, fixed]
 *         description: Filter by promo type
 *     responses:
 *       200:
 *         description: List of promo codes with pagination
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
 *                     promoCodes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PromoCode'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      type: req.query.type as string,
    };
    
    const result = await PromoCode.getPromoCodesWithStats(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch promo codes'
    });
  }
});

/**
 * @swagger
 * /api/promos:
 *   post:
 *     summary: Create a new promo code
 *     tags: [Promos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PromoCodeInput'
 *     responses:
 *       201:
 *         description: Promo code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PromoCode'
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: Promo code already exists
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const promoData = promoCodeSchema.parse(req.body);
    
    // Check if promo code already exists
    const existingPromo = await PromoCode.findOne({ code: promoData.code });
    if (existingPromo) {
      return res.status(409).json({
        success: false,
        error: 'Promo code already exists'
      });
    }
    
    const promoCode = new PromoCode(promoData);
    await promoCode.save();
    
    return res.status(201).json({
      success: true,
      data: promoCode
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    console.error('Error creating promo code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create promo code'
    });
  }
});

/**
 * @swagger
 * /api/promos/{id}:
 *   get:
 *     summary: Get promo code by ID
 *     tags: [Promos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *     responses:
 *       200:
 *         description: Promo code details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PromoCode'
 *       404:
 *         description: Promo code not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid promo code ID'
      });
    }
    
    const promoCode = await PromoCode.findById(id);
    
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        error: 'Promo code not found'
      });
    }
    
    return res.json({
      success: true,
      data: promoCode
    });
  } catch (error) {
    console.error('Error fetching promo code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch promo code'
    });
  }
});

/**
 * @swagger
 * /api/promos/{id}:
 *   put:
 *     summary: Update promo code
 *     tags: [Promos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PromoCodeInput'
 *     responses:
 *       200:
 *         description: Promo code updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PromoCode'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Promo code not found
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = promoCodeSchema.partial().parse(req.body);
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid promo code ID'
      });
    }
    
    const promoCode = await PromoCode.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        error: 'Promo code not found'
      });
    }
    
    return res.json({
      success: true,
      data: promoCode
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    console.error('Error updating promo code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update promo code'
    });
  }
});

/**
 * @swagger
 * /api/promos/{id}:
 *   delete:
 *     summary: Delete promo code
 *     tags: [Promos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *     responses:
 *       200:
 *         description: Promo code deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Promo code not found
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid promo code ID'
      });
    }
    
    const promoCode = await PromoCode.findByIdAndDelete(id);
    
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        error: 'Promo code not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Promo code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete promo code'
    });
  }
});

/**
 * @swagger
 * /api/promos/validate/{code}:
 *   get:
 *     summary: Validate promo code
 *     tags: [Promos]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code to validate
 *       - in: query
 *         name: subtotal
 *         schema:
 *           type: number
 *         description: Order subtotal for validation
 *     responses:
 *       200:
 *         description: Promo code validation result
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
 *                     isValid:
 *                       type: boolean
 *                     discount:
 *                       type: number
 *                     promoCode:
 *                       $ref: '#/components/schemas/PromoCode'
 *       400:
 *         description: Invalid promo code
 */
router.get('/validate/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const subtotal = req.query.subtotal ? parseFloat(req.query.subtotal as string) : 0;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Promo code is required'
      });
    }
    
    const promoCode = await PromoCode.findValidPromoCode(code, subtotal);
    
    if (!promoCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired promo code'
      });
    }
    
    const discount = promoCode.calculateDiscount(subtotal);
    
    return res.json({
      success: true,
      data: {
        isValid: true,
        discount,
        promoCode
      }
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate promo code'
    });
  }
});

/**
 * @swagger
 * /api/promos/analytics:
 *   get:
 *     summary: Get promo code analytics
 *     tags: [Promos]
 *     responses:
 *       200:
 *         description: Promo code analytics
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
 *                     totalPromoCodes:
 *                       type: number
 *                     activePromoCodes:
 *                       type: number
 *                     totalUsage:
 *                       type: number
 *                     averageUsage:
 *                       type: number
 *                     typeStats:
 *                       type: object
 */
router.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    const analytics = await PromoCode.getPromoAnalytics();
    
    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching promo analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch promo analytics'
    });
  }
});

export default router;
