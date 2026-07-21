import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { CreateItemInput } from 'src/items/graphql/inputs/create-item.input';
import { ITEM_RULES } from 'src/items/policy/items.rules';
import { ItemDataGenerator } from 'src/seed/generators/item-data.generator';

const pipe = new AppValidationPipe(mock<HttpLoggerService>());
const itemDataGenerator = new ItemDataGenerator();
const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateItemInput,
};

describe('CreateItemInput', () => {
    describe('Title is too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                title: 'a'.repeat(ITEM_RULES.TITLE.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Title is too short', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                title: 'a'.repeat(ITEM_RULES.TITLE.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Title is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                title: 12345,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Description is too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                description: 'a'.repeat(ITEM_RULES.DESCRIPTION.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Description is too short', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                description: 'a'.repeat(ITEM_RULES.DESCRIPTION.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Description is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                description: true,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Category is too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                category: 'a'.repeat(ITEM_RULES.CATEGORY.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Category is too short', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                category: 'a'.repeat(ITEM_RULES.CATEGORY.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Category is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                category: ['invalid'],
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Tags is not an array', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                tags: 'not-an-array',
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Tags array has too many items', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                tags: Array.from(
                    { length: ITEM_RULES.TAGS.MAX_ARRAY_SIZE + 1 },
                    (_, i) => `tag${i}`,
                ),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Tag item is too short', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                tags: ['a'.repeat(ITEM_RULES.TAGS.TAG_MIN_LENGTH - 1)],
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Tag item is too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                tags: ['a'.repeat(ITEM_RULES.TAGS.TAG_MAX_LENGTH + 1)],
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Tag item is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemDataGenerator.itemInput,
                tags: [123, 456],
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Valid input with all fields', () => {
        test('successfully validate and transform data', async () => {
            const data = {
                title: '  Valid Title  ',
                description:
                    'This is a valid description that meets the minimum length requirement.',
                category: '  Electronics  ',
                tags: ['  Tag1  ', '  TAG2  ', '  tAg3  '],
            };
            const result = await pipe.transform(data, metadata);
            expect(result).toBeDefined();
            expect(result.title).toBe('Valid Title');
            expect(result.category).toBe('electronics');
            expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
        });
    });

    describe('Valid input without optional tags', () => {
        test('successfully validate data without tags', async () => {
            const data = {
                title: 'Valid Title',
                description: 'This is a valid description.',
                category: 'Electronics',
            };
            const result = await pipe.transform(data, metadata);
            expect(result).toBeDefined();
            expect(result.title).toBe('Valid Title');
            expect(result.category).toBe('electronics');
        });
    });
});
