import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AddressService } from '../service/index.js';
import { getAuthIdentityIdFromRequest } from '@hyperlocal/shared/constants';
import { sendSuccess } from '../utils/response.js';
import type {
  CreateAddressPayload,
  UpdateAddressPayload,
  SaveCurrentLocationPayload,
} from '../validators/index.js';

export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  async listAddresses(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.userId;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const addresses = await this.addressService.listAddresses(userId, authIdentityId);
      return sendSuccess(res, addresses);
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.userId;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const payload = req.body as CreateAddressPayload;
      const address = await this.addressService.createAddress(userId, payload, authIdentityId);
      return sendSuccess(res, address, StatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId, addressId } = req.params;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const payload = req.body as UpdateAddressPayload;
      const address = await this.addressService.updateAddress(
        userId,
        addressId,
        payload,
        authIdentityId,
      );
      return sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }

  async setDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId, addressId } = req.params;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const address = await this.addressService.setDefaultAddress(
        userId,
        addressId,
        authIdentityId,
      );
      return sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }

  async getDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.userId;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const address = await this.addressService.getDefaultAddress(userId, authIdentityId);
      return sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }

  async saveCurrentLocation(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.userId;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const payload = req.body as SaveCurrentLocationPayload;
      const address = await this.addressService.saveCurrentLocation(userId, payload, authIdentityId);
      return sendSuccess(res, address, StatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async getCurrentLocation(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.params.userId;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      const address = await this.addressService.getCurrentLocation(userId, authIdentityId);
      return sendSuccess(res, address);
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId, addressId } = req.params;
      const authIdentityId = getAuthIdentityIdFromRequest(req.headers);
      await this.addressService.deleteAddress(userId, addressId, authIdentityId);
      return sendSuccess(res, { message: 'Address deleted' });
    } catch (error) {
      next(error);
    }
  }
}
