import { z } from 'zod';

// Product Variant Schema
export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  attributes: z.record(z.string()).optional(),
});

// Product Schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  variants: z.array(productVariantSchema).min(1, 'At least one variant is required'),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// Cart Item Schema
export const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

// Cart Schema
export const cartSchema = z.object({
  items: z.array(cartItemSchema).default([]),
  promoCode: z.string().optional(),
});

// Promo Code Schema
export const promoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required').toUpperCase(),
  type: z.enum(['percentage', 'fixed'], {
    errorMap: () => ({ message: 'Type must be either "percentage" or "fixed"' }),
  }),
  value: z.number().positive('Value must be positive'),
  maxDiscount: z.number().positive('Max discount must be positive').optional(),
  minOrderAmount: z.number().positive('Min order amount must be positive').optional(),
  validFrom: z.date(),
  validTo: z.date(),
  maxUses: z.number().int().positive('Max uses must be a positive integer').optional(),
  usedCount: z.number().int().min(0, 'Used count must be non-negative').default(0),
  isActive: z.boolean().default(true),
});

// Checkout Schema
export const checkoutSchema = z.object({
  cartId: z.string().min(1, 'Cart ID is required'),
  customerInfo: z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
  }),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  billingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }).optional(),
  paymentMethod: z.enum(['credit_card', 'paypal', 'stripe'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  promoCode: z.string().optional(),
});

// Order Update Schema
export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Query Parameters Schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).default('10'),
});

export const productQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.string().transform(val => parseFloat(val)).pipe(z.number().positive()).optional(),
  maxPrice: z.string().transform(val => parseFloat(val)).pipe(z.number().positive()).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const orderQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Export types
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CartInput = z.infer<typeof cartSchema>;
export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
