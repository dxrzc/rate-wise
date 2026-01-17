import { SignUpInput } from 'src/auth/dtos/sign-up.input';

export interface ICreateUserData extends SignUpInput {
    readonly passwordHash: string;
}
