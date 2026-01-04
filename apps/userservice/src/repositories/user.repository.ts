import { prisma } from '../config';

export class AuthRepository {
  
    async createUser(payload ){

        return await prisma.user.upsert({
        where: { authIdentityId: payload.authIdentityId },
        update: {},
        create: {
          authIdentityId: payload.authIdentityId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
        },
      }); 
    }
}
