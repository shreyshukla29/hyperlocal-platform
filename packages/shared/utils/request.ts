import type { Request } from 'express';

/**
 * Read a single route param as string. Express may give params as string | string[].
 */
export function getRequestParam(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}
