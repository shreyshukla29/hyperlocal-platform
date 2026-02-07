import { ProviderRepository } from '../repositories/provider.repository.js';
import { ProviderAvailabilityRepository } from '../repositories/provider-availability.repository.js';
import { NotFoundError, BadRequestError } from '@hyperlocal/shared/errors';

export interface OpenIntervalsResult {
  date: string;
  openIntervals: { startMinutes: number; endMinutes: number }[];
}

export class ProviderAvailabilityService {
  constructor(
    private readonly providerRepo: ProviderRepository,
    private readonly availabilityRepo: ProviderAvailabilityRepository,
  ) {}

  async getOpenIntervalsForDate(
    providerId: string,
    dateStr: string,
  ): Promise<OpenIntervalsResult> {
    const provider = await this.providerRepo.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError('Invalid date');
    }
    const hasOff = await this.availabilityRepo.hasDayOff(providerId, date);
    if (hasOff) {
      return {
        date: dateStr.slice(0, 10),
        openIntervals: [],
      };
    }
    const schedule = await this.availabilityRepo.getScheduleForDate(providerId, date);
    if (!schedule) {
      return {
        date: dateStr.slice(0, 10),
        openIntervals: [],
      };
    }
    return {
      date: dateStr.slice(0, 10),
      openIntervals: [{ startMinutes: schedule.startMinutes, endMinutes: schedule.endMinutes }],
    };
  }
}
