const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Headless E-commerce API',
      version: '1.0.0',
      description: 'A comprehensive headless e-commerce backend API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/swagger-schemas.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Write to file
fs.writeFileSync('./swagger.json', JSON.stringify(swaggerSpec, null, 2));
console.log('✅ swagger.json generated successfully!');
