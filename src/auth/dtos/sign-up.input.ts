import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AUTH_LIMITS } from '../constants/auth.constants';
import { Transform } from 'class-transformer';

@InputType()
export class SignUpInput {
    @IsString()
    @MinLength(AUTH_LIMITS.USERNAME.MIN)
    @MaxLength(AUTH_LIMITS.USERNAME.MAX)
    @Transform(({ value }: { value: string }) => value.trim())
    @Field(() => String, {
        description: `        
        **Constraints:**
        - Length between ${AUTH_LIMITS.USERNAME.MIN} and ${AUTH_LIMITS.USERNAME.MAX} characters.
        `,
    })
    username!: string;

    @IsString()
    @IsEmail()
    @MaxLength(AUTH_LIMITS.EMAIL.MAX)
    @Field(() => String, {
        description: `
        **Constraints:**
        - Valid email format.
        - Maximum length of ${AUTH_LIMITS.EMAIL.MAX} characters.
        `,
    })
    email!: string;

    @IsString()
    @MinLength(AUTH_LIMITS.PASSWORD.MIN)
    @MaxLength(AUTH_LIMITS.PASSWORD.MAX)
    @Field(() => String, {
        description: `        
        **Constraints:**
        - Length between ${AUTH_LIMITS.PASSWORD.MIN} and ${AUTH_LIMITS.PASSWORD.MAX} characters.
        `,
    })
    password!: string;
}
