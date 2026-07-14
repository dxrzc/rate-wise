import * as z from 'zod';
import { REGISTER_POLICY } from '../policy/register.policy';

const usernameMinLength = REGISTER_POLICY.USERNAME.MIN;
const usernameMaxLength = REGISTER_POLICY.USERNAME.MAX;
const passwordMinLength = REGISTER_POLICY.PASSWORD.MIN;

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
            .max(REGISTER_POLICY.PASSWORD.MAX),
        confirmPassword: z.string().min(1, 'Please confirm your password.'),
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
        if (password !== confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Passwords do not match.',
                path: ['confirmPassword'],
            });
        }
    });
