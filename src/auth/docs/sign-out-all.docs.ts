import { MutationOptions } from '@nestjs/graphql';

export const signOutAllDocs: MutationOptions = {
    name: 'signOutAll',
    description:
        'Sign out the authenticated user from all active sessions. Requires password re-authentication for security. Destroys all user sessions and clears authentication cookies.',
};
