import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AUTH_LIMITS } from '../../constants/auth.limits';
import { Transform } from 'class-transformer';

@InputType({
    description: 'Input data required for user sign-up.',
})
export class SignUpInput {
    @IsString()
    @MinLength(AUTH_LIMITS.USERNAME.MIN)
    @MaxLength(AUTH_LIMITS.USERNAME.MAX)
    @Transform(({ value }: { value: string }) => value.trim())
    @Field(() => String, {
        description: `
            The username for the account.
            - **Minimum length:** ${AUTH_LIMITS.USERNAME.MIN} characters.
            - **Maximum length:** ${AUTH_LIMITS.USERNAME.MAX} characters.
        `,
    })
    readonly username!: string;

    @IsString()
    @IsEmail()
    @Field(() => String, {
        description: `
            The email address for the account.
            - **Must be a valid email format.**
        `,
    })
    readonly email!: string;

    @IsString()
    @MinLength(AUTH_LIMITS.PASSWORD.MIN)
    @MaxLength(AUTH_LIMITS.PASSWORD.MAX)
    @Field(() => String, {
        description: `
            The password for the account.
            - **Minimum length:** ${AUTH_LIMITS.PASSWORD.MIN} characters.
            - **Maximum length:** ${AUTH_LIMITS.PASSWORD.MAX} characters.
        `,
    })
    readonly password!: string;
}
