import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AUTH_RULES } from '../../policy/auth.rules';
import { Transform } from 'class-transformer';

@InputType({
    description: 'Input data required for user sign-up.',
})
export class SignUpInput {
    @IsString()
    @MinLength(AUTH_RULES.USERNAME.MIN)
    @MaxLength(AUTH_RULES.USERNAME.MAX)
    @Transform(({ value }: { value: string }) => value.trim())
    @Field(() => String, {
        description: `
            The username for the account.
            - **Minimum length:** ${AUTH_RULES.USERNAME.MIN} characters.
            - **Maximum length:** ${AUTH_RULES.USERNAME.MAX} characters.
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
    @MinLength(AUTH_RULES.PASSWORD.MIN)
    @MaxLength(AUTH_RULES.PASSWORD.MAX)
    @Field(() => String, {
        description: `
            The password for the account.
            - **Minimum length:** ${AUTH_RULES.PASSWORD.MIN} characters.
            - **Maximum length:** ${AUTH_RULES.PASSWORD.MAX} characters.
        `,
    })
    readonly password!: string;
}
