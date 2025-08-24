/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: number
 *           description: Product price
 *         originalPrice:
 *           type: number
 *           description: Original price before discount
 *         category:
 *           type: string
 *           description: Product category
 *         brand:
 *           type: string
 *           description: Product brand
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Product image URLs
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Product tags
 *         stock:
 *           type: integer
 *           description: Available stock quantity
 *         sku:
 *           type: string
 *           description: Stock keeping unit
 *         weight:
 *           type: number
 *           description: Product weight
 *         dimensions:
 *           type: object
 *           properties:
 *             length:
 *               type: number
 *             width:
 *               type: number
 *             height:
 *               type: number
 *         isActive:
 *           type: boolean
 *           description: Whether the product is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - price
 *         - category
 *         - stock
 *         - sku
 *     
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         total:
 *           type: integer
 *           description: Total number of items
 *         pages:
 *           type: integer
 *           description: Total number of pages
 *         hasNext:
 *           type: boolean
 *           description: Whether there is a next page
 *         hasPrev:
 *           type: boolean
 *           description: Whether there is a previous page
 *     
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Cart ID
 *         token:
 *           type: string
 *           description: Cart token
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               subtotal:
 *                 type: number
 *         subtotal:
 *           type: number
 *           description: Cart subtotal
 *         discount:
 *           type: number
 *           description: Applied discount amount
 *         total:
 *           type: number
 *           description: Cart total after discount
 *         promoCode:
 *           type: string
 *           description: Applied promo code
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Cart expiration date
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID
 *         quantity:
 *           type: integer
 *           description: Item quantity
 *           minimum: 1
 *     
 *     PromoCode:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Promo code ID
 *         code:
 *           type: string
 *           description: Promo code
 *         type:
 *           type: string
 *           enum: [percentage, fixed]
 *           description: Discount type
 *         value:
 *           type: number
 *           description: Discount value
 *         minOrderAmount:
 *           type: number
 *           description: Minimum order amount required
 *         maxUses:
 *           type: integer
 *           description: Maximum number of uses
 *         usedCount:
 *           type: integer
 *           description: Number of times used
 *         isActive:
 *           type: boolean
 *           description: Whether the promo code is active
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Order ID
 *         orderNumber:
 *           type: string
 *           description: Order number
 *         customerInfo:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *             address:
 *               type: object
 *               properties:
 *                 street:
 *                   type: string
 *                 city:
 *                   type: string
 *                 state:
 *                   type: string
 *                 zipCode:
 *                   type: string
 *                 country:
 *                   type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               subtotal:
 *                 type: number
 *         subtotal:
 *           type: number
 *           description: Order subtotal
 *         discount:
 *           type: number
 *           description: Applied discount
 *         total:
 *           type: number
 *           description: Order total
 *         status:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *           description: Order status
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           description: Payment status
 *         promoCode:
 *           type: string
 *           description: Applied promo code
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     OrderUpdateInput:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *           description: Order status
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           description: Payment status
 *         trackingNumber:
 *           type: string
 *           description: Shipping tracking number
 *         notes:
 *           type: string
 *           description: Order notes
 *     
 *     CheckoutInput:
 *       type: object
 *       required:
 *         - customerInfo
 *         - items
 *       properties:
 *         token:
 *           type: string
 *           description: Cart token
 *         customerInfo:
 *           type: object
 *           required:
 *             - name
 *             - email
 *           properties:
 *             name:
 *               type: string
 *               description: Customer name
 *             email:
 *               type: string
 *               format: email
 *               description: Customer email
 *             phone:
 *               type: string
 *               description: Customer phone
 *             address:
 *               type: object
 *               required:
 *                 - street
 *                 - city
 *                 - state
 *                 - zipCode
 *                 - country
 *               properties:
 *                 street:
 *                   type: string
 *                   description: Street address
 *                 city:
 *                   type: string
 *                   description: City
 *                 state:
 *                   type: string
 *                   description: State/Province
 *                 zipCode:
 *                   type: string
 *                   description: ZIP/Postal code
 *                 country:
 *                   type: string
 *                   description: Country
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity
 *         promoCode:
 *           type: string
 *           description: Promo code to apply
 *     
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Error message
 *         details:
 *           type: object
 *           description: Additional error details
 *     
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           description: Response data
 *         message:
 *           type: string
 *           description: Success message
 */
