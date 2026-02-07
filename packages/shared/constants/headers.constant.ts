export const HEADERS = {
  AUTHORIZATION: 'authorization',
  CORRELATION_ID: 'x-correlation-id',
  SESSION_ID: 'x-session-id',
  USER_CONTEXT: 'x-user-context',
  GATEWAY_API_KEY: 'x-gateway-api-key',
} as const;

/**
 * Headers set by API Gateway when proxying to backend services.
 * Backend services (user, provider, etc.) use these to resolve the caller.
 */
export const REQUEST_HEADERS = {
  AUTH_IDENTITY_ID: 'x-user-id',
} as const;

export function getAuthIdentityIdFromRequest(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const value = headers[REQUEST_HEADERS.AUTH_IDENTITY_ID];
  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined;
}
