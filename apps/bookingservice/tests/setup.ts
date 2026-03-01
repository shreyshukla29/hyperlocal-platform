// Test env only; no real DB or payment — all tests use mocked prisma and mocked Razorpay/events.
process.env.GATEWAY_API_KEY = process.env.GATEWAY_API_KEY ?? 'test-gateway-key';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/booking_test';
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? 'test-key-id';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? 'test-key-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? 'test-webhook-secret';
process.env.RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://localhost';
