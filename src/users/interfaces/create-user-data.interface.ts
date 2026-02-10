import { SignUpInput } from 'src/auth/graphql/inputs/sign-up.input';

export interface ICreateUserData extends SignUpInput {
    readonly passwordHash: string;
}
