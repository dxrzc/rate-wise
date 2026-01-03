import { InputType, PickType } from '@nestjs/graphql';
import { SignInInput } from './sign-in.input';

@InputType({
    description: 'Input type for requesting sign out from all sessions',
})
export class RequestSignOutAllInput extends PickType(SignInInput, ['email'] as const) {}
