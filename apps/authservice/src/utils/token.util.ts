import jwt, {
  JwtPayload,
  SignOptions,
  VerifyOptions,
} from 'jsonwebtoken';


export type JwtCustomPayload<T extends object> = T & JwtPayload;


export function createToken<T extends object>(params: {
  payload: T;
  secretKey: string;
  options?: SignOptions;
}): string {
  const { payload, secretKey, options } = params;
console.log(secretKey)
  return jwt.sign(payload, secretKey, {
    ...options,
  });
}


export function verifyToken<T extends object>(params: {
  token: string;
  secretKey: string;
  options?: VerifyOptions;
}): JwtCustomPayload<T> {
  const { token, secretKey, options } = params;

  return jwt.verify(token, secretKey, {
    algorithms: ['HS256'],
    ...options,
  }) as JwtCustomPayload<T>;
}
