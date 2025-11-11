import { MutationOptions } from '@nestjs/graphql';

export const suspendAccountDocs: MutationOptions = {
    name: 'suspendAccount',
    description:
        'Suspend a user account, preventing them from accessing the system. Only available to administrators and moderators. Admin accounts cannot be suspended.',
};
