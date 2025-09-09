import { IsEmail, IsString, MaxLength } from 'class-validator';
import { AUTH_LIMITS } from '../constants/auth.constants';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SignInInput {
    @IsString()
    @IsEmail()
    @MaxLength(AUTH_LIMITS.EMAIL.MAX)
    @Field(() => String)
    email!: string;

    @IsString()
    @MaxLength(AUTH_LIMITS.PASSWORD.MAX)
    @Field(() => String)
    password!: string;
}
