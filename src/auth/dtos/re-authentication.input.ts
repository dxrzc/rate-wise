import { InputType, PickType } from '@nestjs/graphql';
import { SignInInput } from './sign-in.input';

@InputType()
export class ReAuthenticationInput extends PickType(SignInInput, ['password'] as const) {}
