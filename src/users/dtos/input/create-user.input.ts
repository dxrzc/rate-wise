import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from 'src/common/constants/user.constants';
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimAndLowercase } from 'src/common/functions/utils/trim-and-lowercase.util';

@InputType()
export class CreateUserInput {
    @IsString()
    @MinLength(USERNAME_MIN_LENGTH)
    @MaxLength(USERNAME_MAX_LENGTH)
    @Field(() => String)
    username!: string;

    @IsString()
    @IsEmail()
    @Transform(trimAndLowercase)
    @Field(() => String)
    email!: string;

    @IsString()
    @MinLength(PASSWORD_MIN_LENGTH)
    @MaxLength(PASSWORD_MAX_LENGTH)
    @Field(() => String)
    password!: string;
}
