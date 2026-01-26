import { UserModel } from '../generated/prisma/models/User';
import { UpdateUserProfilePayload } from '../validators';

export type UserResponse = UserModel;

export interface CreateUserPayload {
  authIdentityId: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
}

export interface UpdateUserRepositoryPayload {
  firstName?: string;
  lastName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
}

export interface UploadAvatarParams {
  userId: string;
  fileBuffer?: Buffer;
  requestingAuthId?: string;
}
