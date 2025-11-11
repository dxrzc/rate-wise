import { MutationOptions } from '@nestjs/graphql';

export const requestAccountDeletionDocs: MutationOptions = {
    name: 'requestAccountDeletion',
    description:
        'Send an account deletion confirmation email to the authenticated user. The user must confirm deletion via the email link.',
};
