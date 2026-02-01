import { Router } from 'express';
import { AddressController } from '../../controllers';
import { AddressService } from '../../service';
import { AddressRepository, UserRepository } from '../../repositories';
import { validateBody } from '@hyperlocal/shared/middlewares';
import {
  createAddressSchema,
  updateAddressSchema,
  saveCurrentLocationSchema,
} from '../../validators';

export const addressRouter = Router();

const addressRepository = new AddressRepository();
const userRepository = new UserRepository();
const addressService = new AddressService(addressRepository, userRepository);
const addressController = new AddressController(addressService);

addressRouter.get(
  '/user/:userId/addresses',
  addressController.listAddresses.bind(addressController),
);

addressRouter.post(
  '/user/:userId/addresses',
  validateBody(createAddressSchema),
  addressController.createAddress.bind(addressController),
);

addressRouter.post(
  '/user/:userId/addresses/current-location',
  validateBody(saveCurrentLocationSchema),
  addressController.saveCurrentLocation.bind(addressController),
);

addressRouter.get(
  '/user/:userId/addresses/current-location',
  addressController.getCurrentLocation.bind(addressController),
);

addressRouter.get(
  '/user/:userId/addresses/default',
  addressController.getDefaultAddress.bind(addressController),
);

addressRouter.patch(
  '/user/:userId/addresses/:addressId',
  validateBody(updateAddressSchema),
  addressController.updateAddress.bind(addressController),
);

addressRouter.patch(
  '/user/:userId/addresses/:addressId/default',
  addressController.setDefaultAddress.bind(addressController),
);

addressRouter.delete(
  '/user/:userId/addresses/:addressId',
  addressController.deleteAddress.bind(addressController),
);
