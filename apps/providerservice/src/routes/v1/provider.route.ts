import { Router } from 'express';
import { validateBody } from '@hyperlocal/shared/middlewares';
import { ProviderController } from '../../controllers/provider.controller.js';
import { ServicePersonController } from '../../controllers/service-person.controller.js';
import { ProviderOfferingController } from '../../controllers/provider-offering.controller.js';
import { ProviderAvailabilityController } from '../../controllers/provider-availability.controller.js';
import { ProviderService } from '../../service/provider.service.js';
import { ServicePersonService } from '../../service/service-person.service.js';
import { ProviderOfferingService } from '../../service/provider-offering.service.js';
import { ProviderAvailabilityService } from '../../service/provider-availability.service.js';
import { ProviderRepository } from '../../repositories/provider.repository.js';
import { ServicePersonRepository } from '../../repositories/service-person.repository.js';
import { ProviderOfferingRepository } from '../../repositories/provider-offering.repository.js';
import { ProviderAvailabilityRepository } from '../../repositories/provider-availability.repository.js';
import {
  updateProviderProfileSchema,
  updateVerificationStatusSchema,
  createServicePersonSchema,
  updateServicePersonSchema,
  updateServicePersonStatusSchema,
  createProviderOfferingSchema,
  updateProviderOfferingSchema,
} from '../../validators/index.js';

export const providerRouter = Router();

const providerRepository = new ProviderRepository();
const providerService = new ProviderService(providerRepository);
const providerController = new ProviderController(providerService);

const servicePersonRepository = new ServicePersonRepository();
const servicePersonService = new ServicePersonService(
  providerRepository,
  servicePersonRepository,
);
const servicePersonController = new ServicePersonController(servicePersonService);

const offeringRepository = new ProviderOfferingRepository();
const offeringService = new ProviderOfferingService(
  providerRepository,
  offeringRepository,
);
const offeringController = new ProviderOfferingController(offeringService);

const availabilityRepository = new ProviderAvailabilityRepository();
const availabilityService = new ProviderAvailabilityService(
  providerRepository,
  availabilityRepository,
);
const availabilityController = new ProviderAvailabilityController(availabilityService);

// Top providers by location (for dashboard / discovery – paginated)
providerRouter.get(
  '/top-by-location',
  providerController.getTopProvidersByLocation.bind(providerController),
);

// Open intervals for a date (from schedule + day-off). Used by Booking for available slots.
providerRouter.get(
  '/:providerId/availability/open-intervals',
  availabilityController.getOpenIntervals.bind(availabilityController),
);

// Provider profile
providerRouter.get(
  '/profile',
  providerController.getProviderProfile.bind(providerController),
);

providerRouter.patch(
  '/profile/:id',
  validateBody(updateProviderProfileSchema),
  providerController.updateProviderProfile.bind(providerController),
);

// Admin: set provider verification status (VERIFIED | PENDING | REJECTED)
providerRouter.patch(
  '/:providerId/verification',
  validateBody(updateVerificationStatusSchema),
  providerController.updateVerificationStatus.bind(providerController),
);

// Provider service offerings (add, list, get, update, delete)
providerRouter.post(
  '/services',
  validateBody(createProviderOfferingSchema),
  offeringController.create.bind(offeringController),
);

providerRouter.get(
  '/services',
  offeringController.list.bind(offeringController),
);

providerRouter.get(
  '/services/:id',
  offeringController.getById.bind(offeringController),
);

// Booking quote: price from backend only (no auth; called by Booking service). GET /api/v1/provider/:providerId/services/:providerServiceId/booking-quote
providerRouter.get(
  '/:providerId/services/:providerServiceId/booking-quote',
  offeringController.getBookingQuote.bind(offeringController),
);

providerRouter.patch(
  '/services/:id',
  validateBody(updateProviderOfferingSchema),
  offeringController.update.bind(offeringController),
);

providerRouter.delete(
  '/services/:id',
  offeringController.delete.bind(offeringController),
);

// Service persons (field workers) – only verified provider can create
providerRouter.post(
  '/service-people',
  validateBody(createServicePersonSchema),
  servicePersonController.create.bind(servicePersonController),
);

providerRouter.get(
  '/service-people',
  servicePersonController.list.bind(servicePersonController),
);

providerRouter.get(
  '/service-people/:id',
  servicePersonController.getById.bind(servicePersonController),
);

providerRouter.patch(
  '/service-people/:id',
  validateBody(updateServicePersonSchema),
  servicePersonController.update.bind(servicePersonController),
);

providerRouter.patch(
  '/service-people/:id/status',
  validateBody(updateServicePersonStatusSchema),
  servicePersonController.updateStatus.bind(servicePersonController),
);

providerRouter.delete(
  '/service-people/:id',
  servicePersonController.deactivate.bind(servicePersonController),
);
