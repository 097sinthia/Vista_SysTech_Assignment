import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  variantId: string;
  quantity: number;
  price: number;
  productName: string;
  variantName: string;
  sku: string;
}

export interface ICart extends Document {
  token: string;
  items: ICartItem[];
  promoCode?: string;
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateTotals(): ICart;
  addItem(itemData: {
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    productName: string;
    variantName: string;
    sku: string;
  }): Promise<ICart>;
  updateItemQuantity(productId: string, variantId: string, quantity: number): Promise<ICart>;
  removeItem(productId: string, variantId: string): Promise<ICart>;
  clearCart(): Promise<ICart>;
  applyPromoCode(promoCode: string, discountAmount: number): Promise<ICart>;
  removePromoCode(): Promise<ICart>;
}

// Static methods interface
export interface ICartModel extends mongoose.Model<ICart> {
  getCartWithDetails(token: string): Promise<ICart | null>;
  createOrGetCart(token?: string): Promise<ICart>;
  generateToken(): string;
}

const cartItemSchema = new Schema<ICartItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  productName: { type: String, required: true },
  variantName: { type: String, required: true },
  sku: { type: String, required: true },
});

const cartSchema = new Schema<ICart>({
  token: { type: String, required: true, unique: true },
  items: [cartItemSchema],
  promoCode: { type: String },
  subtotal: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true,
});

// Indexes
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
cartSchema.index({ promoCode: 1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

// Instance method to calculate cart totals
cartSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum: number, item: ICartItem) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal - this.discount;
  return this;
};

// Static method to get cart with aggregation pipeline
(cartSchema.statics as any).getCartWithDetails = async function(token: string) {
  const pipeline = [
    { $match: { token, expiresAt: { $gt: new Date() } } },
    {
      $lookup: {
        from: 'products',
        localField: 'items.productId',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    {
      $addFields: {
        items: {
          $map: {
            input: '$items',
            as: 'item',
            in: {
              $mergeObjects: [
                '$$item',
                {
                  product: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$productDetails',
                          as: 'product',
                          cond: { $eq: ['$$product._id', '$$item.productId'] }
                        }
                      },
                      0
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $project: {
        productDetails: 0
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || null;
};

// Static method to create or get cart
(cartSchema.statics as any).createOrGetCart = async function(token?: string) {
  if (!token) {
    token = (this as any).generateToken();
  }

  let cart = await this.findOne({ token, expiresAt: { $gt: new Date() } });
  
  if (!cart) {
    cart = new this({
      token,
      items: [],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await cart.save();
  }

  return cart;
};

// Static method to generate unique token
(cartSchema.statics as any).generateToken = function(): string {
  return 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Instance method to add item to cart
cartSchema.methods.addItem = async function(itemData: {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  productName: string;
  variantName: string;
  sku: string;
}) {
  const existingItemIndex = this.items.findIndex(
    (item: ICartItem) => item.productId.toString() === itemData.productId && item.variantId === itemData.variantId
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += itemData.quantity;
  } else {
    this.items.push({
      ...itemData,
      productId: new mongoose.Types.ObjectId(itemData.productId),
    });
  }

  this.calculateTotals();
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId: string, variantId: string, quantity: number) {
  const itemIndex = this.items.findIndex(
    (item: ICartItem) => item.productId.toString() === productId && item.variantId === variantId
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    this.items.splice(itemIndex, 1);
  } else {
    this.items[itemIndex].quantity = quantity;
  }

  this.calculateTotals();
  return this.save();
};

// Instance method to remove item
cartSchema.methods.removeItem = async function(productId: string, variantId: string) {
  this.items = this.items.filter(
    (item: ICartItem) => !(item.productId.toString() === productId && item.variantId === variantId)
  );
  
  this.calculateTotals();
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.promoCode = undefined;
  this.discount = 0;
  this.calculateTotals();
  return this.save();
};

// Instance method to apply promo code
cartSchema.methods.applyPromoCode = async function(promoCode: string, discountAmount: number) {
  this.promoCode = promoCode;
  this.discount = Math.min(discountAmount, this.subtotal);
  this.calculateTotals();
  return this.save();
};

// Instance method to remove promo code
cartSchema.methods.removePromoCode = async function() {
  this.promoCode = undefined;
  this.discount = 0;
  this.calculateTotals();
  return this.save();
};

export const Cart = mongoose.model<ICart, ICartModel>('Cart', cartSchema);
