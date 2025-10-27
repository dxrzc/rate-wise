import { IsEmail, IsString } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SignInInput {
    @IsString()
    @IsEmail()
    @Field(() => String)
    email!: string;

    @IsString()
    @Field(() => String)
    password!: string;
}
