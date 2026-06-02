import * as z from 'zod';

import { parseTags } from '../utils/parse-tags.util';
import { ITEM_POLICY } from '../policy/item.policy';

export const createItemSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(
                ITEM_POLICY.TITLE.MIN,
                `Title must be at least ${ITEM_POLICY.TITLE.MIN} characters.`,
            )
            .max(
                ITEM_POLICY.TITLE.MAX,
                `Title must be at most ${ITEM_POLICY.TITLE.MAX} characters.`,
            ),
        description: z
            .string()
            .trim()
            .min(
                ITEM_POLICY.DESCRIPTION.MIN,
                `Description must be at least ${ITEM_POLICY.DESCRIPTION.MIN} characters.`,
            )
            .max(
                ITEM_POLICY.DESCRIPTION.MAX,
                `Description must be at most ${ITEM_POLICY.DESCRIPTION.MAX} characters.`,
            ),
        category: z
            .string()
            .trim()
            .min(
                ITEM_POLICY.CATEGORY.MIN,
                `Category must be at least ${ITEM_POLICY.CATEGORY.MIN} characters.`,
            )
            .max(
                ITEM_POLICY.CATEGORY.MAX,
                `Category must be at most ${ITEM_POLICY.CATEGORY.MAX} characters.`,
            ),
        // Comma-separated list: "tag1, tag2, tag3"
        tagsRaw: z.string().default('') as unknown as z.ZodString,
    })
    .superRefine(({ tagsRaw }, ctx) => {
        const tags = parseTags(tagsRaw ?? '');

        if (tags.length > ITEM_POLICY.TAGS.MAX_ARRAY_SIZE) {
            ctx.addIssue({
                code: 'too_big',
                maximum: ITEM_POLICY.TAGS.MAX_ARRAY_SIZE,
                origin: 'array',
                inclusive: true,
                message: `You can add up to ${ITEM_POLICY.TAGS.MAX_ARRAY_SIZE} tags.`,
                input: tags,
                path: ['tagsRaw'],
            });
        }

        for (const tag of tags) {
            if (
                tag.length < ITEM_POLICY.TAGS.TAG_MIN_LENGTH ||
                tag.length > ITEM_POLICY.TAGS.TAG_MAX_LENGTH
            ) {
                ctx.addIssue({
                    code: 'custom',
                    message: `Each tag must be between ${ITEM_POLICY.TAGS.TAG_MIN_LENGTH}-${ITEM_POLICY.TAGS.TAG_MAX_LENGTH} characters.`,
                    input: tag,
                    path: ['tagsRaw'],
                });
            }
        }
    });
