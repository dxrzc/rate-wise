import { MutationOptions } from '@nestjs/graphql';

export const requestAccountVerificationDocs: MutationOptions = {
    name: 'requestAccountVerification',
    description:
        'Send an account verification email to the authenticated user. Only available for users with PENDING_VERIFICATION status.',
};
