import { IsEmail, IsString, MaxLength } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import {
    MAX_EMAIL_LENGTH,
    PASSWORD_MAX_LENGTH,
} from '../constants/auth.constants';

@InputType()
export class SignInInput {
    @IsString()
    @IsEmail()
    @MaxLength(MAX_EMAIL_LENGTH)
    @Field(() => String)
    email!: string;

    @IsString()
    @MaxLength(PASSWORD_MAX_LENGTH)
    @Field(() => String)
    password!: string;
}
