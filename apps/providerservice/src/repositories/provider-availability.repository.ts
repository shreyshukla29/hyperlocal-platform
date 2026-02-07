import { prisma as defaultPrisma } from '../config/index.js';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

function getDayOfWeek(date: Date): (typeof DAY_NAMES)[number] {
  const dayIndex = date.getUTCDay();
  return DAY_NAMES[dayIndex];
}

export interface OpenInterval {
  startMinutes: number;
  endMinutes: number;
}

export class ProviderAvailabilityRepository {
  constructor(private prisma = defaultPrisma) {}

  async getScheduleForDate(providerId: string, date: Date): Promise<OpenInterval | null> {
    const dayOfWeek = getDayOfWeek(date);
    const row = await this.prisma.providerSchedule.findUnique({
      where: {
        providerId_dayOfWeek: { providerId, dayOfWeek },
      },
    });
    if (!row || row.startTimeMinutes >= row.endTimeMinutes) return null;
    return {
      startMinutes: row.startTimeMinutes,
      endMinutes: row.endTimeMinutes,
    };
  }

  async hasDayOff(providerId: string, date: Date): Promise<boolean> {
    const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const count = await this.prisma.providerDayOff.count({
      where: {
        providerId,
        date: dateOnly,
      },
    });
    return count > 0;
  }
}
