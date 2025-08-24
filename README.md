# Headless E-commerce Backend

A comprehensive headless e-commerce backend built with Node.js, TypeScript, Express, and MongoDB. This API provides all the essential functionality for a modern e-commerce platform including product catalog, cart management, promo codes, checkout, and order management.

## 🚀 Features

### Core Functionality
- **Catalog Management**: Browse products with variants, filtering, and search
- **Cart System**: Guest-first cart with token-based management
- **Promo Codes**: Percentage and fixed discounts with validation
- **Checkout Process**: Complete order creation with stock validation
- **Order Management**: Full order lifecycle with status tracking

### Technical Features
- **TypeScript**: Full type safety and modern JavaScript features
- **MongoDB Aggregation**: Advanced queries and analytics
- **Input Validation**: Comprehensive validation with Zod
- **API Documentation**: OpenAPI/Swagger documentation
- **Error Handling**: Robust error handling and logging
- **Rate Limiting**: Built-in rate limiting for API protection
- **Testing**: Comprehensive test suite with Jest

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd headless-ecommerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/headless-ecommerce
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Seed the database with sample data
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## 📚 API Documentation

Once the server is running, visit `http://localhost:3000/api-docs` for interactive API documentation.

### Base URL
```
http://localhost:3000/api
```

## 🔧 API Endpoints

### Catalog

#### Get Products
```http
GET /api/catalog/products
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by category
- `brand` (string): Filter by brand
- `search` (string): Search in name, description, tags
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Sort field (name, price, createdAt)
- `sortOrder` (string): Sort order (asc, desc)

#### Get Product by ID
```http
GET /api/catalog/products/:id
```

#### Get Categories
```http
GET /api/catalog/categories
```

#### Get Brands
```http
GET /api/catalog/brands
```

#### Search Products
```http
GET /api/catalog/search?q=query
```

### Cart

#### Create/Get Cart
```http
POST /api/cart
```

**Request Body:**
```json
{
  "token": "optional-existing-token"
}
```

#### Get Cart by Token
```http
GET /api/cart/:token
```

#### Add Item to Cart
```http
POST /api/cart/:token/items
```

**Request Body:**
```json
{
  "productId": "product-id",
  "variantId": "variant-id",
  "quantity": 2
}
```

#### Update Item Quantity
```http
PUT /api/cart/:token/items/:productId/:variantId
```

**Request Body:**
```json
{
  "quantity": 3
}
```

#### Remove Item from Cart
```http
DELETE /api/cart/:token/items/:productId/:variantId
```

#### Apply Promo Code
```http
POST /api/cart/:token/promo
```

**Request Body:**
```json
{
  "code": "WELCOME10"
}
```

#### Remove Promo Code
```http
DELETE /api/cart/:token/promo
```

#### Clear Cart
```http
POST /api/cart/:token/clear
```

### Promo Codes

#### Get Promo Codes
```http
GET /api/promos
```

#### Create Promo Code
```http
POST /api/promos
```

**Request Body:**
```json
{
  "code": "SAVE20",
  "type": "percentage",
  "value": 20,
  "maxDiscount": 100,
  "minOrderAmount": 50,
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": "2024-12-31T23:59:59.999Z",
  "maxUses": 500
}
```

#### Validate Promo Code
```http
GET /api/promos/validate/:code?subtotal=100
```

#### Get Promo Analytics
```http
GET /api/promos/analytics/overview
```

### Checkout

#### Create Order
```http
POST /api/checkout
```

**Request Body:**
```json
{
  "cartId": "cart-id",
  "customerInfo": {
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  },
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card",
  "promoCode": "WELCOME10"
}
```

#### Validate Checkout
```http
POST /api/checkout/validate
```

#### Calculate Order Totals
```http
POST /api/checkout/calculate
```

### Orders

#### Get Orders
```http
GET /api/orders
```

#### Get Order by ID
```http
GET /api/orders/:id
```

#### Update Order Status
```http
PUT /api/orders/:id
```

**Request Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "TRK123456789",
  "notes": "Order shipped via express delivery"
}
```

#### Get Order by Number
```http
GET /api/orders/number/:orderNumber
```

#### Get Customer Orders
```http
GET /api/orders/customer/:email
```

#### Get Order Analytics
```http
GET /api/orders/analytics/overview
```

#### Get Revenue Analytics
```http
GET /api/orders/analytics/revenue?startDate=2024-01-01&endDate=2024-12-31
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📊 Database Schema

### Product
```typescript
{
  name: string;
  description: string;
  category: string;
  brand: string;
  images?: string[];
  variants: ProductVariant[];
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Cart
```typescript
{
  token: string;
  items: CartItem[];
  promoCode?: string;
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### PromoCode
```typescript
{
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
}
```

### Order
```typescript
{
  orderNumber: string;
  cartId: ObjectId;
  customerInfo: CustomerInfo;
  shippingAddress: Address;
  billingAddress?: Address;
  items: OrderItem[];
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
}
```

## 🔒 Security Features

- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **CORS**: Configurable CORS settings
- **Helmet**: Security headers with helmet middleware
- **Error Handling**: Comprehensive error handling without exposing sensitive data

## 📈 Performance Features

- **MongoDB Aggregation**: Efficient queries using aggregation pipelines
- **Indexing**: Optimized database indexes for fast queries
- **Pagination**: Built-in pagination for large datasets
- **Caching**: Ready for Redis integration
- **Compression**: Response compression for better performance

## 🚀 Deployment

### Environment Variables
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://your-mongodb-uri
JWT_SECRET=your-production-jwt-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the test files for usage examples

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete e-commerce functionality
- MongoDB aggregation pipelines
- Comprehensive test suite
- OpenAPI documentation
- Production-ready architecture
