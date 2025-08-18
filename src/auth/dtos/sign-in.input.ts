import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../constants/auth.constants';

@InputType()
export class SignInInput {
    @IsString()
    @IsEmail()
    @Field(() => String)
    email!: string;

    @IsString()
    @MaxLength(PASSWORD_MAX_LENGTH)
    @Field(() => String)
    password!: string;
}
