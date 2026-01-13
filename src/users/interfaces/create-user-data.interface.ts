import { SignUpInput } from 'src/auth/dtos/sign-up.input';

export interface ICreateUserData extends SignUpInput {
    passwordHash: string;
}
