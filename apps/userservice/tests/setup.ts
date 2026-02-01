process.env.GATEWAY_API_KEY = process.env.GATEWAY_API_KEY ?? 'test-gateway-key';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
process.env.RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://localhost';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? 'test';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? 'test';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? 'test';
