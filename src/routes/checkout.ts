import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Cart } from '../models/Cart';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { PromoCode } from '../models/PromoCode';
import { checkoutSchema, CheckoutInput } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Create order from cart
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutInput'
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *         description: Invalid request or insufficient stock
 *       404:
 *         description: Cart not found
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const checkoutData = checkoutSchema.parse(req.body);
    
    // Get cart
    const cart = await Cart.findOne({ 
      _id: checkoutData.cartId, 
      expiresAt: { $gt: new Date() } 
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }
    
    // Validate stock for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.productName} is no longer available`
        });
      }
      
      if (!product.isInStock(item.variantId, item.quantity)) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${item.productName} - ${item.variantName}`
        });
      }
    }
    
    // Validate promo code if provided
    let finalDiscount = cart.discount;
    if (checkoutData.promoCode) {
      const promoCode = await PromoCode.findValidPromoCode(checkoutData.promoCode, cart.subtotal);
      if (!promoCode) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired promo code'
        });
      }
      finalDiscount = promoCode.calculateDiscount(cart.subtotal);
    }
    
    // Create order
    const order = new Order({
      cartId: cart._id,
      customerInfo: checkoutData.customerInfo,
      shippingAddress: checkoutData.shippingAddress,
      billingAddress: checkoutData.billingAddress || checkoutData.shippingAddress,
      items: cart.items,
      subtotal: cart.subtotal,
      discount: finalDiscount,
      total: cart.subtotal - finalDiscount,
      promoCode: checkoutData.promoCode || cart.promoCode,
      paymentMethod: checkoutData.paymentMethod,
      status: 'pending',
      paymentStatus: 'pending',
    });
    
    await order.save();
    
    // Update stock for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        await product.updateStock(item.variantId, item.quantity);
      }
    }
    
    // Increment promo code usage if used
    if (checkoutData.promoCode) {
      const promoCode = await PromoCode.findOne({ code: checkoutData.promoCode });
      if (promoCode) {
        await promoCode.incrementUsage();
      }
    }
    
    // Clear cart
    await cart.clearCart();
    
    return res.status(201).json({
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
    
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

/**
 * @swagger
 * /api/checkout/validate:
 *   post:
 *     summary: Validate checkout data
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutInput'
 *     responses:
 *       200:
 *         description: Checkout validation result
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
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     cart:
 *                       $ref: '#/components/schemas/Cart'
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const checkoutData = checkoutSchema.parse(req.body);
    
    // Get cart
    const cart = await Cart.findOne({ 
      _id: checkoutData.cartId, 
      expiresAt: { $gt: new Date() } 
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    const errors: string[] = [];
    
    // Validate stock for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        errors.push(`Product ${item.productName} is no longer available`);
        continue;
      }
      
      if (!product.isInStock(item.variantId, item.quantity)) {
        errors.push(`Insufficient stock for ${item.productName} - ${item.variantName}`);
      }
    }
    
    // Validate promo code if provided
    if (checkoutData.promoCode) {
      const promoCode = await PromoCode.findValidPromoCode(checkoutData.promoCode, cart.subtotal);
      if (!promoCode) {
        errors.push('Invalid or expired promo code');
      }
    }
    
    return res.json({
      success: true,
      data: {
        isValid: errors.length === 0,
        errors,
        cart
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    console.error('Error validating checkout:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate checkout'
    });
  }
});

/**
 * @swagger
 * /api/checkout/calculate:
 *   post:
 *     summary: Calculate order totals
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartId
 *             properties:
 *               cartId:
 *                 type: string
 *               promoCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order calculation result
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
 *                     subtotal:
 *                       type: number
 *                     discount:
 *                       type: number
 *                     total:
 *                       type: number
 *                     promoCode:
 *                       $ref: '#/components/schemas/PromoCode'
 *       404:
 *         description: Cart not found
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { cartId, promoCode } = req.body;
    
    if (!cartId) {
      return res.status(400).json({
        success: false,
        error: 'Cart ID is required'
      });
    }
    
    // Get cart
    const cart = await Cart.findOne({ 
      _id: cartId, 
      expiresAt: { $gt: new Date() } 
    });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    let discount = 0;
    let promoCodeData = null;
    
    // Calculate discount if promo code provided
    if (promoCode) {
      promoCodeData = await PromoCode.findValidPromoCode(promoCode, cart.subtotal);
      if (promoCodeData) {
        discount = promoCodeData.calculateDiscount(cart.subtotal);
      }
    }
    
    const total = cart.subtotal - discount;
    
    return res.json({
      success: true,
      data: {
        subtotal: cart.subtotal,
        discount,
        total,
        promoCode: promoCodeData
      }
    });
  } catch (error) {
    console.error('Error calculating order totals:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate order totals'
    });
  }
});

export default router;
