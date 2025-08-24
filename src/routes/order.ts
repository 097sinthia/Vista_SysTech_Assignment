import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order';
import { orderUpdateSchema, OrderUpdateInput, orderQuerySchema } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders with filtering and pagination
 *     tags: [Orders]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders until this date
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by customer email
 *     responses:
 *       200:
 *         description: List of orders with pagination
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      email: req.query.email as string,
    };
    
    const result = await Order.getOrdersWithDetails(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }
    
    const order = await Order.findById(id).populate('cartId');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderUpdateInput'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = orderUpdateSchema.parse(req.body);
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Update order status
    await order.updateStatus(
      updateData.status,
      updateData.trackingNumber,
      updateData.notes
    );
    
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    console.error('Error updating order:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   put:
 *     summary: Update order payment status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, refunded]
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid payment status
 *       404:
 *         description: Order not found
 */
router.put('/:id/payment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    if (!paymentStatus || !['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment status'
      });
    }
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Update payment status
    await order.updatePaymentStatus(paymentStatus);
    
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update payment status'
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderNumber}:
 *   get:
 *     summary: Get order by order number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/number/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ orderNumber }).populate('cartId');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order by number:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

/**
 * @swagger
 * /api/orders/customer/{email}:
 *   get:
 *     summary: Get orders by customer email
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer email
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
 *         description: Customer orders
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/customer/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const filters = {
      page,
      limit,
      email: email ? decodeURIComponent(email) : undefined
    };
    
    const result = await Order.getOrdersWithDetails(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer orders'
    });
  }
});

/**
 * @swagger
 * /api/orders/analytics/overview:
 *   get:
 *     summary: Get order analytics
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Order analytics
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
 *                     totalOrders:
 *                       type: number
 *                     totalRevenue:
 *                       type: number
 *                     averageOrderValue:
 *                       type: number
 *                     totalItems:
 *                       type: number
 *                     statusStats:
 *                       type: object
 *                     paymentStats:
 *                       type: object
 */
router.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    const analytics = await Order.getOrderAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order analytics'
    });
  }
});

/**
 * @swagger
 * /api/orders/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics by date range
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue analytics
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
 *                     totalRevenue:
 *                       type: number
 *                     orderCount:
 *                       type: number
 *                     averageOrderValue:
 *                       type: number
 *                     dailyRevenue:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/analytics/revenue', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchConditions: any = { paymentStatus: 'paid' };
    if (startDate || endDate) {
      matchConditions.createdAt = {};
      if (startDate) matchConditions.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchConditions.createdAt.$lte = new Date(endDate as string);
    }
    
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          orderCount: { $sum: '$orderCount' },
          averageOrderValue: { $avg: { $divide: ['$revenue', '$orderCount'] } },
          dailyRevenue: {
            $push: {
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day'
                }
              },
              revenue: '$revenue',
              orderCount: '$orderCount'
            }
          }
        }
      }
    ];
    
    const result = await Order.aggregate(pipeline);
    
    res.json({
      success: true,
      data: result[0] || {
        totalRevenue: 0,
        orderCount: 0,
        averageOrderValue: 0,
        dailyRevenue: []
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics'
    });
  }
});

export default router;
