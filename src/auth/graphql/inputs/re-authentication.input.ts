import { InputType, PickType } from '@nestjs/graphql';
import { SignInInput } from './sign-in.input';

@InputType({
    description: 'Input type for re-authentication using password',
})
export class ReAuthenticationInput extends PickType(SignInInput, ['password'] as const) {}
