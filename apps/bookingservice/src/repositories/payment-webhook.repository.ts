import { prisma as defaultPrisma } from '../config/index.js';

export class PaymentWebhookEventRepository {
  constructor(private prisma = defaultPrisma) {}

  async exists(eventId: string): Promise<boolean> {
    const found = await this.prisma.paymentWebhookEvent.findUnique({
      where: { eventId },
    });
    return !!found;
  }

  /**
   * Insert-only: claims the event for processing. Returns true if inserted,
   * false if duplicate (P2002). Use this first so duplicate webhooks return 200
   * without reprocessing (no double payment / double confirm).
   */
  async createStrict(eventId: string, eventType: string): Promise<boolean> {
    try {
      await this.prisma.paymentWebhookEvent.create({
        data: { eventId, eventType },
      });
      return true;
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      if (prismaErr?.code === 'P2002') return false;
      throw err;
    }
  }

  async create(eventId: string, eventType: string): Promise<void> {
    await this.prisma.paymentWebhookEvent.upsert({
      where: { eventId },
      create: { eventId, eventType },
      update: {},
    });
  }
}
