import { MutationOptions } from '@nestjs/graphql';

export const requestAccountVerificationDocs: MutationOptions = {
    name: 'requestAccountVerification',
    description: `
        Send an account verification email to the authenticated user's email address.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** All roles allowed (USER, MODERATOR, ADMIN)
        
        **Account Status Required:** PENDING_VERIFICATION - only users with pending verification status can request verification
        
        **Effect:** Sends a verification email with a confirmation link. Upon successful email verification, the account status is updated to ACTIVE, allowing full access to the platform.
        
        **Rate Limiting:** Ultra-critical throttle applied to prevent email spam
        
        **Returns:** Boolean indicating success (true)
    `,
};
