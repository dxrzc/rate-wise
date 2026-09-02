import * as z from 'zod';
import { REGISTER_POLICY } from '../policies/register.policy';

const usernameMinLength = REGISTER_POLICY.USERNAME.MIN;
const usernameMaxLength = REGISTER_POLICY.USERNAME.MAX;
const passwordMinLength = REGISTER_POLICY.PASSWORD.MIN;
const passwordMaxLength = REGISTER_POLICY.PASSWORD.MAX;

export const registerSchema = z
    .object({
        username: z
            .string()
            .min(usernameMinLength, `Username must be at least ${usernameMinLength}  characters.`)
            .max(usernameMaxLength, `Username must be at most ${usernameMaxLength} characters.`)
            .refine((val) => val === val.toLowerCase(), {
                message: 'String must be all lowercase',
            }),
        email: z.email(),
        password: z
            .string()
            .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters.`)
            .max(passwordMaxLength, `Password must be at most ${passwordMaxLength} characters`),
        confirmPassword: z.string().min(1, 'Please confirm your password.'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });
