import { ServerConfig } from '../config/index.js';
import { HEADERS } from '@hyperlocal/shared/constants';

export interface BookingQuoteResult {
  pricePaise: number;
  durationMinutes: number | null;
  providerAuthId: string;
}

export interface OpenIntervalsResult {
  date: string;
  openIntervals: { startMinutes: number; endMinutes: number }[];
}

/**
 * Get booking quote from Provider service. Amount always comes from backend.
 * Requires PROVIDER_SERVICE_URL and GATEWAY_API_KEY (for service-to-service auth).
 */
export async function getBookingQuote(
  providerId: string,
  providerServiceId: string,
): Promise<BookingQuoteResult> {
  const baseUrl = ServerConfig.PROVIDER_SERVICE_URL;
  if (!baseUrl) {
    throw new Error('PROVIDER_SERVICE_URL is not configured');
  }
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/provider/${providerId}/services/${providerServiceId}/booking-quote`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      [HEADERS.GATEWAY_API_KEY]: ServerConfig.GATEWAY_API_KEY,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    let message = `Provider quote failed: ${res.status}`;
    try {
      const json = JSON.parse(body);
      if (json?.error?.message) message = json.error.message;
    } catch {
      if (body) message = body.slice(0, 200);
    }
    throw new Error(message);
  }
  const json = await res.json();
  if (!json?.success || !json?.data) {
    throw new Error('Invalid provider quote response');
  }
  const { pricePaise, durationMinutes, providerAuthId } = json.data;
  if (
    typeof pricePaise !== 'number' ||
    pricePaise < 100 ||
    typeof providerAuthId !== 'string'
  ) {
    throw new Error('Invalid provider quote data');
  }
  return {
    pricePaise,
    durationMinutes: durationMinutes ?? null,
    providerAuthId,
  };
}

/**
 * Get open intervals for a provider on a date (from Provider schedule + day-off).
 * Used to compute available slots after subtracting existing bookings.
 */
export async function getProviderOpenIntervals(
  providerId: string,
  date: string,
): Promise<OpenIntervalsResult> {
  const baseUrl = ServerConfig.PROVIDER_SERVICE_URL;
  if (!baseUrl) {
    throw new Error('PROVIDER_SERVICE_URL is not configured');
  }
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/provider/${providerId}/availability/open-intervals?date=${encodeURIComponent(date)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      [HEADERS.GATEWAY_API_KEY]: ServerConfig.GATEWAY_API_KEY,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Provider open-intervals failed: ${res.status} ${body.slice(0, 100)}`);
  }
  const json = await res.json();
  if (!json?.success || !json?.data) {
    throw new Error('Invalid provider open-intervals response');
  }
  return json.data;
}
