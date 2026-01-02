import { IsEmail, IsString } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType({
    description: 'Input data required for user sign-in.',
})
export class SignInInput {
    @IsString()
    @IsEmail({})
    @Field(() => String, { description: 'The email address of the user.' })
    email!: string;

    @IsString()
    @Field(() => String, { description: 'The password of the user.' })
    password!: string;
}
