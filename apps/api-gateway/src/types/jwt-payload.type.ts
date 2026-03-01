export interface JwtPayload {
  sub?: string;
  authId?: string;
  email?: string;
  accountType?: string;
  iat?: number;
  exp?: number;
}
