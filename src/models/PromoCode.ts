import mongoose, { Document, Schema } from 'mongoose';

export interface IPromoCode extends Document {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  validFrom: Date;
  validTo: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isValid(): boolean;
  calculateDiscount(subtotal: number): number;
  incrementUsage(): Promise<IPromoCode>;
}

// Static methods interface
export interface IPromoCodeModel extends mongoose.Model<IPromoCode> {
  findValidPromoCode(code: string, subtotal?: number): Promise<IPromoCode | null>;
  getPromoCodesWithStats(filters?: any): Promise<{
    promoCodes: IPromoCode[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getPromoAnalytics(): Promise<any>;
}

const promoCodeSchema = new Schema<IPromoCode>({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true
  },
  type: { 
    type: String, 
    required: true, 
    enum: ['percentage', 'fixed']
  },
  value: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  maxDiscount: { 
    type: Number, 
    min: 0 
  },
  minOrderAmount: { 
    type: Number, 
    min: 0 
  },
  validFrom: { 
    type: Date, 
    required: true
  },
  validTo: { 
    type: Date, 
    required: true
  },
  maxUses: { 
    type: Number, 
    min: 1 
  },
  usedCount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
promoCodeSchema.index({ code: 1, isActive: 1 });
promoCodeSchema.index({ validFrom: 1, validTo: 1, isActive: 1 });
promoCodeSchema.index({ usedCount: 1, maxUses: 1 });

// Instance method to check if promo code is valid
promoCodeSchema.methods.isValid = function(): boolean {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validTo &&
    (!this.maxUses || this.usedCount < this.maxUses)
  );
};

// Instance method to calculate discount amount
promoCodeSchema.methods.calculateDiscount = function(subtotal: number): number {
  if (!this.isValid()) {
    return 0;
  }

  if (this.minOrderAmount && subtotal < this.minOrderAmount) {
    return 0;
  }

  let discount = 0;
  
  if (this.type === 'percentage') {
    discount = (subtotal * this.value) / 100;
  } else {
    discount = this.value;
  }

  // Apply max discount limit
  if (this.maxDiscount) {
    discount = Math.min(discount, this.maxDiscount);
  }

  // Ensure discount doesn't exceed subtotal
  return Math.min(discount, subtotal);
};

// Instance method to increment usage
promoCodeSchema.methods.incrementUsage = async function() {
  this.usedCount += 1;
  return this.save();
};

// Static method to find valid promo code
(promoCodeSchema.statics as any).findValidPromoCode = async function(code: string, subtotal: number = 0) {
  const now = new Date();
  
  const promoCode = await this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
    $or: [
      { maxUses: { $exists: false } },
      { $expr: { $lt: ['$usedCount', '$maxUses'] } }
    ]
  });

  if (!promoCode) {
    return null;
  }

  // Check minimum order amount
  if (promoCode.minOrderAmount && subtotal < promoCode.minOrderAmount) {
    return null;
  }

  return promoCode;
};

// Static method to get promo codes with aggregation pipeline
(promoCodeSchema.statics as any).getPromoCodesWithStats = async function(filters: any = {}) {
  const {
    page = 1,
    limit = 10,
    isActive,
    type,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const matchConditions: any = {};
  if (isActive !== undefined) matchConditions.isActive = isActive;
  if (type) matchConditions.type = type;

  const pipeline: any[] = [
    { $match: matchConditions },
    {
      $addFields: {
        isExpired: { $lt: ['$validTo', new Date()] },
        isOverUsed: { $and: [{ $ne: ['$maxUses', null] }, { $gte: ['$usedCount', '$maxUses'] }] },
        usagePercentage: {
          $cond: {
            if: { $ne: ['$maxUses', null] },
            then: { $multiply: [{ $divide: ['$usedCount', '$maxUses'] }, 100] },
            else: null
          }
        }
      }
    },
    {
      $sort: { [sortBy]: sortDirection }
    },
    {
      $facet: {
        promoCodes: [
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
    promoCodes: result[0]?.promoCodes || [],
    pagination: {
      page,
      limit,
      total: result[0]?.totalCount[0]?.count || 0,
      totalPages: result[0]?.totalPages[0]?.count || 0
    }
  };
};

// Static method to get promo code analytics
(promoCodeSchema.statics as any).getPromoAnalytics = async function() {
  const pipeline: any[] = [
    {
      $group: {
        _id: null,
        totalPromoCodes: { $sum: 1 },
        activePromoCodes: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$isActive', true] },
                { $gte: ['$validTo', new Date()] }
              ]},
              1,
              0
            ]
          }
        },
        totalUsage: { $sum: '$usedCount' },
        averageUsage: { $avg: '$usedCount' },
        byType: {
          $push: {
            type: '$type',
            value: '$value',
            usedCount: '$usedCount'
          }
        }
      }
    },
    {
      $addFields: {
        typeStats: {
          $reduce: {
            input: '$byType',
            initialValue: { percentage: [], fixed: [] },
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $cond: {
                    if: { $eq: ['$$this.type', 'percentage'] },
                    then: { percentage: { $concatArrays: ['$$value.percentage', ['$$this']] } },
                    else: { fixed: { $concatArrays: ['$$value.fixed', ['$$this']] } }
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
        totalPromoCodes: 1,
        activePromoCodes: 1,
        totalUsage: 1,
        averageUsage: { $round: ['$averageUsage', 2] },
        typeStats: 1
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || null;
};

export const PromoCode = mongoose.model<IPromoCode, IPromoCodeModel>('PromoCode', promoCodeSchema);
