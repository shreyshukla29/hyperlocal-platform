import { Router } from 'express';
import { validateBody } from '@hyperlocal/shared/middlewares';
import { ProviderController } from '../../controllers/provider.controller';
import { ServicePersonController } from '../../controllers/service-person.controller';
import { ProviderOfferingController } from '../../controllers/provider-offering.controller';
import { ProviderService } from '../../service/provider.service';
import { ServicePersonService } from '../../service/service-person.service';
import { ProviderOfferingService } from '../../service/provider-offering.service';
import { ProviderRepository } from '../../repositories/provider.repository';
import { ServicePersonRepository } from '../../repositories/service-person.repository';
import { ProviderOfferingRepository } from '../../repositories/provider-offering.repository';
import {
  updateProviderProfileSchema,
  createServicePersonSchema,
  updateServicePersonSchema,
  updateServicePersonStatusSchema,
  createProviderOfferingSchema,
  updateProviderOfferingSchema,
} from '../../validators';

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

// Top providers by location (for dashboard / discovery – paginated)
providerRouter.get(
  '/top-by-location',
  providerController.getTopProvidersByLocation.bind(providerController),
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
