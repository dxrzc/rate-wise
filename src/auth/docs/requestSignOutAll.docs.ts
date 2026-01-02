import { MutationOptions } from '@nestjs/graphql';

export const requestSignOutAllDocs: MutationOptions = {
    name: 'requestSignOutAll',
    description: `
        Send a sign-out-all confirmation email to the provided address so the holder can remotely terminate every session.

        **Authentication:** Not required (open endpoint)

        **Authorization:** Public (no role or account required)

        **Account Status Required:** ACTIVE or PENDING_VERIFICATION - suspended accounts are ignored for safety

        **Effect:** Queues an email containing a secure link. Following the link invokes the public signOutAll endpoint and clears every session for the associated account.

        **Rate Limiting:** Ultra-critical throttle applied to prevent abuse

        **Returns:** A string confirming the email was queued if the address exists, otherwise the same response is returned to avoid user enumeration
    `,
};
