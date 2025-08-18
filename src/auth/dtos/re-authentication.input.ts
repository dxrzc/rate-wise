import { Field, InputType } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../constants/auth.constants';

@InputType()
export class ReAuthenticationInput {
    @IsString()
    @MaxLength(PASSWORD_MAX_LENGTH)
    @Field(() => String)
    password!: string;
}
