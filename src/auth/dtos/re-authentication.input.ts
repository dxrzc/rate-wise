import { InputType, PickType } from '@nestjs/graphql';
import { SignUpInput } from './sign-up.input';

@InputType()
export class ReAuthenticationInput extends PickType(SignUpInput, [
    'password',
] as const) {}
