# User Service Tests

## Structure

```
tests/
├── __mocks__/          # Mock implementations
│   ├── prisma.mock.ts
│   └── logger.mock.ts
├── helpers/            # Test utilities and helpers
│   └── test-helpers.ts
├── repositories/       # Repository layer tests
│   └── user.repository.test.ts
├── services/           # Service layer tests
│   └── user.service.test.ts
└── controllers/        # Controller layer tests
    └── user.controller.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

Tests are organized by layer:
- **Repository Tests**: Test database operations with mocked Prisma
- **Service Tests**: Test business logic with mocked repository
- **Controller Tests**: Test HTTP layer with mocked service

Each test file covers:
- Happy path scenarios
- Error handling
- Edge cases
- Validation logic

