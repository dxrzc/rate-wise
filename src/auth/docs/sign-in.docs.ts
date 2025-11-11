import { MutationOptions } from '@nestjs/graphql';

export const signInDocs: MutationOptions = {
    name: 'signIn',
    description:
        'Authenticate a user with email and password credentials. Creates a new user session upon successful authentication.',
};
