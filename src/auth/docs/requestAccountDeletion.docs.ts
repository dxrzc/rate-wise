import { MutationOptions } from '@nestjs/graphql';

export const requestAccountDeletionDocs: MutationOptions = {
    name: 'requestAccountDeletion',
    description: `
        Send an account deletion confirmation email to the authenticated user.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** All roles allowed (USER, MODERATOR, ADMIN)
        
        **Account Status Required:** Any status (ACTIVE, PENDING_VERIFICATION, SUSPENDED)
        
        **Effect:** Sends a confirmation email with a deletion link. The user must confirm the deletion via the email link for the account to be permanently deleted. This is a two-step process for security.
        
        **Rate Limiting:** Critical throttle applied to prevent abuse
        
        **Returns:** Boolean indicating success (true)
    `,
};
