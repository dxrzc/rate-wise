import { MutationOptions } from '@nestjs/graphql';

export const signOutDocs: MutationOptions = {
    name: 'signOut',
    description:
        'Sign out the authenticated user from the current session. Destroys the current session and clears authentication cookies.',
};
