import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { PromoCode } from '../models/PromoCode';
import { cartItemSchema, CartItemInput } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Create or get cart
 *     tags: [Cart]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Existing cart token (optional)
 *     responses:
 *       200:
 *         description: Cart created or retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    const cart = await Cart.createOrGetCart(token);
    
    return res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error creating/getting cart:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create/get cart'
    });
  }
});

/**
 * @swagger
 * /api/cart/{token}:
 *   get:
 *     summary: Get cart by token
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart token
 *     responses:
 *       200:
 *         description: Cart details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart not found
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }
    
    const cart = await Cart.getCartWithDetails(token);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    return res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch cart'
    });
  }
});

/**
 * @swagger
 * /api/cart/{token}/items:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - variantId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid request or insufficient stock
 *       404:
 *         description: Cart or product not found
 */
router.post('/:token/items', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const itemData = cartItemSchema.parse(req.body);
    
    // Get cart
    const cart = await Cart.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    // Get product and validate
    const product = await Product.findById(itemData.productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Find variant
    const variant = product.variants.find(v => (v as any)._id.toString() === itemData.variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Product variant not found'
      });
    }
    
    // Check stock
    if (!product.isInStock(itemData.variantId, itemData.quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock'
      });
    }
    
    // Add item to cart
    await cart.addItem({
      productId: itemData.productId,
      variantId: itemData.variantId,
      quantity: itemData.quantity,
      price: variant.price,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
    });
    
    return res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    console.error('Error adding item to cart:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
});

/**
 * @swagger
 * /api/cart/{token}/items/{productId}/{variantId}:
 *   put:
 *     summary: Update item quantity in cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart token
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Item quantity updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid quantity or insufficient stock
 *       404:
 *         description: Cart or item not found
 */
router.put('/:token/items/:productId/:variantId', async (req: Request, res: Response) => {
  try {
    const { token, productId, variantId } = req.params;
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a non-negative number'
      });
    }
    
    // Get cart
    const cart = await Cart.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    // Check stock if quantity > 0
    if (quantity > 0 && productId && variantId) {
      const product = await Product.findById(productId);
      if (!product || !product.isInStock(variantId, quantity)) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient stock'
        });
      }
    }
    
    // Update item quantity
    if (productId && variantId) {
      await cart.updateItemQuantity(productId, variantId, quantity);
    }
    
    return res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update item quantity'
    });
  }
});

/**
 * @swagger
 * /api/cart/{token}/items/{productId}/{variantId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart token
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart or item not found
 */
router.delete('/:token/items/:productId/:variantId', async (req: Request, res: Response) => {
  try {
    const { token, productId, variantId } = req.params;
    
    // Get cart
    const cart = await Cart.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    // Remove item
    if (productId && variantId) {
      await cart.removeItem(productId, variantId);
    }
    
    return res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart'
    });
  }
});

/**
 * @swagger
 * /api/cart/{token}/clear:
 *   post:
 *     summary: Clear cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart token
 *     responses:
 *       200:
 *         description: Cart cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart not found
 */
router.post('/:token/clear', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    // Get cart
    const cart = await Cart.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    // Clear cart
    await cart.clearCart();
    
    return res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
});

/**
 * @swagger
 * /api/cart/{token}/promo:
 *   post:
 *     summary: Apply promo code to cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Promo code applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid or expired promo code
 *       404:
 *         description: Cart not found
 */
router.post('/:token/promo', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Promo code is required'
      });
    }
    
    // Get cart
    const cart = await Cart.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    // Find valid promo code
    const promoCode = await PromoCode.findValidPromoCode(code, cart.subtotal);
    if (!promoCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired promo code'
      });
    }
    
    // Calculate discount
    const discountAmount = promoCode.calculateDiscount(cart.subtotal);
    
    // Apply promo code
    await cart.applyPromoCode(code, discountAmount);
    
    return res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error applying promo code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply promo code'
    });
  }
});

/**
 * @swagger
 * /api/cart/{token}/promo:
 *   delete:
 *     summary: Remove promo code from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart token
 *     responses:
 *       200:
 *         description: Promo code removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart not found
 */
router.delete('/:token/promo', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    // Get cart
    const cart = await Cart.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or expired'
      });
    }
    
    // Remove promo code
    await cart.removePromoCode();
    
    return res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error removing promo code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove promo code'
    });
  }
});

export default router;
