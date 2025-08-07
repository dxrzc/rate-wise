import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from '../constants/auth.constants';
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SignUpInput {
    @IsString()
    @MinLength(USERNAME_MIN_LENGTH)
    @MaxLength(USERNAME_MAX_LENGTH)
    @Field(() => String)
    username!: string;

    @IsString()
    @IsEmail()
    @Field(() => String)
    email!: string;

    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    @Field(() => String)
    password!: string;
}
