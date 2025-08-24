import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/Product';
import { PromoCode } from '../models/PromoCode';

dotenv.config();

const sampleProducts = [
  {
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and premium sound quality. Perfect for music lovers and professionals.',
    category: 'Electronics',
    brand: 'AudioTech',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
    ],
    variants: [
      {
        name: 'Black',
        sku: 'AUDIO-001-BLK',
        price: 299.99,
        stock: 50,
        attributes: { color: 'Black', connectivity: 'Bluetooth 5.0' }
      },
      {
        name: 'White',
        sku: 'AUDIO-001-WHT',
        price: 299.99,
        stock: 30,
        attributes: { color: 'White', connectivity: 'Bluetooth 5.0' }
      },
      {
        name: 'Premium Black',
        sku: 'AUDIO-001-PBLK',
        price: 399.99,
        stock: 20,
        attributes: { color: 'Premium Black', connectivity: 'Bluetooth 5.0', warranty: '2 years' }
      }
    ],
    tags: ['wireless', 'noise-cancelling', 'premium', 'bluetooth'],
    isActive: true
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking watch with heart rate monitoring, GPS, and smartphone connectivity. Track your workouts and health metrics.',
    category: 'Electronics',
    brand: 'FitTech',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500'
    ],
    variants: [
      {
        name: 'Sport Edition',
        sku: 'FIT-001-SPORT',
        price: 199.99,
        stock: 75,
        attributes: { color: 'Black', waterResistance: '5ATM', batteryLife: '7 days' }
      },
      {
        name: 'Premium Edition',
        sku: 'FIT-001-PREM',
        price: 299.99,
        stock: 40,
        attributes: { color: 'Silver', waterResistance: '5ATM', batteryLife: '14 days', gps: 'Built-in' }
      }
    ],
    tags: ['fitness', 'smartwatch', 'health', 'tracking'],
    isActive: true
  },
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt. Available in multiple colors and sizes. Perfect for everyday wear.',
    category: 'Clothing',
    brand: 'EcoWear',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500'
    ],
    variants: [
      {
        name: 'Small - White',
        sku: 'TSHIRT-001-S-WHT',
        price: 24.99,
        stock: 100,
        attributes: { size: 'S', color: 'White', material: 'Organic Cotton' }
      },
      {
        name: 'Medium - White',
        sku: 'TSHIRT-001-M-WHT',
        price: 24.99,
        stock: 120,
        attributes: { size: 'M', color: 'White', material: 'Organic Cotton' }
      },
      {
        name: 'Large - White',
        sku: 'TSHIRT-001-L-WHT',
        price: 24.99,
        stock: 80,
        attributes: { size: 'L', color: 'White', material: 'Organic Cotton' }
      },
      {
        name: 'Small - Black',
        sku: 'TSHIRT-001-S-BLK',
        price: 24.99,
        stock: 90,
        attributes: { size: 'S', color: 'Black', material: 'Organic Cotton' }
      },
      {
        name: 'Medium - Black',
        sku: 'TSHIRT-001-M-BLK',
        price: 24.99,
        stock: 110,
        attributes: { size: 'M', color: 'Black', material: 'Organic Cotton' }
      },
      {
        name: 'Large - Black',
        sku: 'TSHIRT-001-L-BLK',
        price: 24.99,
        stock: 70,
        attributes: { size: 'L', color: 'Black', material: 'Organic Cotton' }
      }
    ],
    tags: ['organic', 'cotton', 'sustainable', 'comfortable'],
    isActive: true
  },
  {
    name: 'Professional Coffee Maker',
    description: 'High-end coffee maker with programmable settings, built-in grinder, and thermal carafe. Perfect for coffee enthusiasts.',
    category: 'Home & Kitchen',
    brand: 'BrewMaster',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500'
    ],
    variants: [
      {
        name: 'Standard',
        sku: 'COFFEE-001-STD',
        price: 149.99,
        stock: 25,
        attributes: { capacity: '12 cups', programmable: 'Yes', thermalCarafe: 'Yes' }
      },
      {
        name: 'Professional',
        sku: 'COFFEE-001-PRO',
        price: 249.99,
        stock: 15,
        attributes: { capacity: '12 cups', programmable: 'Yes', thermalCarafe: 'Yes', builtInGrinder: 'Yes', wifi: 'Yes' }
      }
    ],
    tags: ['coffee', 'kitchen', 'professional', 'programmable'],
    isActive: true
  },
  {
    name: 'Yoga Mat Premium',
    description: 'Non-slip yoga mat made from eco-friendly materials. Perfect thickness for comfort and stability during practice.',
    category: 'Sports & Fitness',
    brand: 'YogaLife',
    images: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
      'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=500'
    ],
    variants: [
      {
        name: 'Standard',
        sku: 'YOGA-001-STD',
        price: 39.99,
        stock: 60,
        attributes: { thickness: '4mm', material: 'Eco-friendly TPE', size: '68" x 24"' }
      },
      {
        name: 'Premium',
        sku: 'YOGA-001-PREM',
        price: 69.99,
        stock: 30,
        attributes: { thickness: '6mm', material: 'Natural Rubber', size: '72" x 26"', alignment: 'Yes' }
      }
    ],
    tags: ['yoga', 'fitness', 'eco-friendly', 'non-slip'],
    isActive: true
  },
  {
    name: 'Wireless Bluetooth Speaker',
    description: 'Portable wireless speaker with 360-degree sound and waterproof design. Perfect for outdoor activities and parties.',
    category: 'Electronics',
    brand: 'SoundWave',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500'
    ],
    variants: [
      {
        name: 'Mini',
        sku: 'SPEAKER-001-MINI',
        price: 79.99,
        stock: 45,
        attributes: { size: 'Mini', batteryLife: '8 hours', waterproof: 'IPX4', connectivity: 'Bluetooth 5.0' }
      },
      {
        name: 'Standard',
        sku: 'SPEAKER-001-STD',
        price: 129.99,
        stock: 35,
        attributes: { size: 'Standard', batteryLife: '12 hours', waterproof: 'IPX7', connectivity: 'Bluetooth 5.0' }
      },
      {
        name: 'Premium',
        sku: 'SPEAKER-001-PREM',
        price: 199.99,
        stock: 20,
        attributes: { size: 'Premium', batteryLife: '20 hours', waterproof: 'IPX7', connectivity: 'Bluetooth 5.0', stereo: 'Yes' }
      }
    ],
    tags: ['bluetooth', 'portable', 'waterproof', 'wireless'],
    isActive: true
  }
];

const samplePromoCodes = [
  {
    code: 'SINTHIA20',
    type: 'percentage' as const,
    value: 20,
    maxDiscount: 100,
    minOrderAmount: 100,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2028-12-31'),
    maxUses: 1000,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'SAVE20',
    type: 'percentage' as const,
    value: 20,
    maxDiscount: 100,
    minOrderAmount: 50,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-06-30'),
    maxUses: 500,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'FREESHIP',
    type: 'fixed' as const,
    value: 15,
    maxDiscount: 15,
    minOrderAmount: 75,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    maxUses: 2000,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'FLASH25',
    type: 'percentage' as const,
    value: 25,
    maxDiscount: 75,
    minOrderAmount: 30,
    validFrom: new Date('2024-03-01'),
    validTo: new Date('2024-03-31'),
    maxUses: 200,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'NEWCUSTOMER',
    type: 'fixed' as const,
    value: 25,
    maxDiscount: 25,
    minOrderAmount: 100,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    maxUses: 1000,
    usedCount: 0,
    isActive: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/headless-ecommerce';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Product.deleteMany({});
    await PromoCode.deleteMany({});
    console.log('✅ Existing data cleared');

    // Seed products
    console.log('📦 Seeding products...');
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ ${products.length} products seeded`);

    // Seed promo codes
    console.log('🎫 Seeding promo codes...');
    const promoCodes = await PromoCode.insertMany(samplePromoCodes);
    console.log(`✅ ${promoCodes.length} promo codes seeded`);

    // Create indexes
    console.log('📊 Creating indexes...');
    await Product.createIndexes();
    await PromoCode.createIndexes();
    console.log('✅ Indexes created');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Products: ${products.length}`);
    console.log(`   Promo Codes: ${promoCodes.length}`);
    console.log('\n🔗 API Documentation: http://localhost:3000/api-docs');
    console.log('\n🧪 Test the API with these sample requests:');
    console.log('   GET /api/catalog/products');
    console.log('   GET /api/catalog/products/[product-id]');
    console.log('   POST /api/cart');
    console.log('   GET /api/promos');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run seeder
seedDatabase();
