import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  variantId: string;
  quantity: number;
  price: number;
  productName: string;
  variantName: string;
  sku: string;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ICustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  cartId: mongoose.Types.ObjectId;
  customerInfo: ICustomerInfo;
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'credit_card' | 'paypal' | 'stripe';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateStatus(status: string, trackingNumber?: string, notes?: string): Promise<IOrder>;
  updatePaymentStatus(paymentStatus: string): Promise<IOrder>;
}

// Static methods interface
export interface IOrderModel extends mongoose.Model<IOrder> {
  generateOrderNumber(): string;
  getOrdersWithDetails(filters?: any): Promise<{
    orders: IOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getOrderAnalytics(): Promise<any>;
}

const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
});

const customerInfoSchema = new Schema<ICustomerInfo>({
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
});

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  productName: { type: String, required: true },
  variantName: { type: String, required: true },
  sku: { type: String, required: true },
});

const orderSchema = new Schema<IOrder>({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true
  },
  cartId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Cart', 
    required: true 
  },
  customerInfo: customerInfoSchema,
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  promoCode: { type: String },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['credit_card', 'paypal', 'stripe']
  },
  paymentStatus: { 
    type: String, 
    required: true, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  trackingNumber: { type: String },
  notes: { type: String },
}, {
  timestamps: true,
});

// Indexes for better query performance
orderSchema.index({ 'customerInfo.email': 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ total: 1 });
orderSchema.index({ promoCode: 1 });
orderSchema.index({ paymentMethod: 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = (this.constructor as any).generateOrderNumber();
  }
  next();
});

// Static method to generate unique order number
(orderSchema.statics as any).generateOrderNumber = function(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Static method to get orders with aggregation pipeline
(orderSchema.statics as any).getOrdersWithDetails = async function(filters: any = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    startDate,
    endDate,
    email,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const matchConditions: any = {};
  if (status) matchConditions.status = status;
  if (paymentStatus) matchConditions.paymentStatus = paymentStatus;
  if (email) matchConditions['customerInfo.email'] = { $regex: email, $options: 'i' };
  if (startDate || endDate) {
    matchConditions.createdAt = {};
    if (startDate) matchConditions.createdAt.$gte = new Date(startDate);
    if (endDate) matchConditions.createdAt.$lte = new Date(endDate);
  }

  const pipeline: any[] = [
    { $match: matchConditions },
    {
      $lookup: {
        from: 'carts',
        localField: 'cartId',
        foreignField: '_id',
        as: 'cartDetails'
      }
    },
    {
      $addFields: {
        cart: { $arrayElemAt: ['$cartDetails', 0] },
        itemCount: { $size: '$items' },
        totalItems: {
          $reduce: {
            input: '$items',
            initialValue: 0,
            in: { $add: ['$$value', '$$this.quantity'] }
          }
        }
      }
    },
    {
      $project: {
        cartDetails: 0
      }
    },
    {
      $sort: { [sortBy]: sortDirection }
    },
    {
      $facet: {
        orders: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [{ $count: 'count' }],
        totalPages: [
          { $count: 'count' },
          {
            $addFields: {
              count: { $ceil: { $divide: ['$count', limit] } }
            }
          }
        ]
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  return {
    orders: result[0]?.orders || [],
    pagination: {
      page,
      limit,
      total: result[0]?.totalCount[0]?.count || 0,
      totalPages: result[0]?.totalPages[0]?.count || 0
    }
  };
};

// Static method to get order analytics
(orderSchema.statics as any).getOrderAnalytics = async function() {
  const pipeline: any[] = [
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        totalItems: {
          $sum: {
            $reduce: {
              input: '$items',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.quantity'] }
            }
          }
        },
        byStatus: {
          $push: {
            status: '$status',
            total: '$total'
          }
        },
        byPaymentMethod: {
          $push: {
            paymentMethod: '$paymentMethod',
            total: '$total'
          }
        },
        byMonth: {
          $push: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            total: '$total'
          }
        }
      }
    },
    {
      $addFields: {
        statusStats: {
          $reduce: {
            input: '$byStatus',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $literal: {
                    $concat: [
                      '$$this.status',
                      ': ',
                      { $toString: '$$this.total' }
                    ]
                  }
                }
              ]
            }
          }
        },
        paymentStats: {
          $reduce: {
            input: '$byPaymentMethod',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $literal: {
                    $concat: [
                      '$$this.paymentMethod',
                      ': ',
                      { $toString: '$$this.total' }
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
        _id: 0,
        totalOrders: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        totalItems: 1,
        statusStats: 1,
        paymentStats: 1
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || null;
};

// Instance method to update order status
orderSchema.methods.updateStatus = async function(status: string, trackingNumber?: string, notes?: string) {
  this.status = status;
  if (trackingNumber) this.trackingNumber = trackingNumber;
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to update payment status
orderSchema.methods.updatePaymentStatus = async function(paymentStatus: string) {
  this.paymentStatus = paymentStatus;
  return this.save();
};

export const Order = mongoose.model<IOrder, IOrderModel>('Order', orderSchema);
