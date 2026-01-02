export const USER_SIGNED_UP_EVENT = 'USER_SIGNED_UP' as const;

export interface UserSignedUpEvent {
  event: typeof USER_SIGNED_UP_EVENT;

  authIdentityId: string;
  firstName: string;
  lastName: string;

  email?: string;
  phone?: string;

  accountType: 'USER' | 'PROVIDER';
  occurredAt: string;
}
