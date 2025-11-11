import { MutationOptions } from '@nestjs/graphql';

export const signUpDocs: MutationOptions = {
    name: 'signUp',
    description:
        'Register a new user account with email and password. Creates a new user session upon successful registration.',
};
