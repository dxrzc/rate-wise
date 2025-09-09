import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AUTH_LIMITS } from '../constants/auth.constants';

@InputType()
export class SignUpInput {
    @IsString()
    @MinLength(AUTH_LIMITS.USERNAME.MIN)
    @MaxLength(AUTH_LIMITS.USERNAME.MAX)
    @Field(() => String)
    username!: string;

    @IsString()
    @IsEmail()
    @MaxLength(AUTH_LIMITS.EMAIL.MAX)
    @Field(() => String)
    email!: string;

    @IsString()
    @MinLength(AUTH_LIMITS.PASSWORD.MIN)
    @MaxLength(AUTH_LIMITS.PASSWORD.MAX)
    @Field(() => String)
    password!: string;
}
