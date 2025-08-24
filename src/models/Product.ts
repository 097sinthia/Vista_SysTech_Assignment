import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  brand: string;
  images?: string[];
  variants: IProductVariant[];
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateStock(variantId: string, quantity: number): Promise<IProduct>;
  isInStock(variantId: string, quantity?: number): boolean;
}

// Static methods interface
export interface IProductModel extends mongoose.Model<IProduct> {
  getProductsWithAggregation(filters: any): Promise<{
    products: IProduct[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getProductById(productId: string): Promise<IProduct[]>;
}

const productVariantSchema = new Schema<IProductVariant>({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  attributes: { type: Map, of: String, default: {} },
});

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  images: [{ type: String, validate: {
    validator: function(v: string) {
      return /^https?:\/\/.+/.test(v);
    },
    message: 'Invalid image URL'
  }}],
  variants: [productVariantSchema],
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, brand: 1, isActive: 1 });
productSchema.index({ 'variants.price': 1 });
productSchema.index({ createdAt: -1 });

// Static method to get products with aggregation pipeline
(productSchema.statics as any).getProductsWithAggregation = async function(filters: any) {
  const {
    page = 1,
    limit = 10,
    category,
    brand,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  // Build match conditions
  const matchConditions: any = { isActive: true };

  if (category) matchConditions.category = category;
  if (brand) matchConditions.brand = brand;
  if (minPrice || maxPrice) {
    matchConditions['variants.price'] = {};
    if (minPrice) matchConditions['variants.price'].$gte = minPrice;
    if (maxPrice) matchConditions['variants.price'].$lte = maxPrice;
  }

  // Text search
  if (search) {
    matchConditions.$text = { $search: search };
  }

  const pipeline: any[] = [
    { $match: matchConditions },
    {
      $addFields: {
        minPrice: { $min: '$variants.price' },
        maxPrice: { $max: '$variants.price' },
        totalStock: { $sum: '$variants.stock' },
        variantCount: { $size: '$variants' }
      }
    },
    {
      $sort: { [sortBy]: sortDirection }
    },
    {
      $facet: {
        products: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: 1,
              description: 1,
              category: 1,
              brand: 1,
              images: 1,
              variants: 1,
              tags: 1,
              minPrice: 1,
              maxPrice: 1,
              totalStock: 1,
              variantCount: 1,
              createdAt: 1,
              updatedAt: 1
            }
          }
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
    products: result[0]?.products || [],
    pagination: {
      page,
      limit,
      total: result[0]?.totalCount[0]?.count || 0,
      totalPages: result[0]?.totalPages[0]?.count || 0
    }
  };
};

// Static method to get product by ID with variant details
(productSchema.statics as any).getProductById = async function(productId: string) {
  return this.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(productId), isActive: true } },
    {
      $addFields: {
        minPrice: { $min: '$variants.price' },
        maxPrice: { $max: '$variants.price' },
        totalStock: { $sum: '$variants.stock' },
        availableVariants: {
          $filter: {
            input: '$variants',
            as: 'variant',
            cond: { $gt: ['$$variant.stock', 0] }
          }
        }
      }
    }
  ]);
};

// Instance method to update stock
productSchema.methods.updateStock = async function(variantId: string, quantity: number) {
  const variant = this.variants.id(variantId);
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  if (variant.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  variant.stock -= quantity;
  return this.save();
};

// Instance method to check if product is in stock
productSchema.methods.isInStock = function(variantId: string, quantity: number = 1): boolean {
  const variant = this.variants.id(variantId);
  return variant ? variant.stock >= quantity : false;
};

export const Product = mongoose.model<IProduct, IProductModel>('Product', productSchema);
