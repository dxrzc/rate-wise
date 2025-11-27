import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { ITEMS_LIMITS } from 'src/items/constants/items.constants';
import { CreateItemInput } from 'src/items/dtos/create-item.input';
import { ItemsSeedService } from 'src/seed/services/items-seed.service';

const pipe = new AppValidationPipe(mock<HttpLoggerService>());
const itemsSeed = new ItemsSeedService();
const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateItemInput,
};

describe('CreateItemInput', () => {
    describe('Title is too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
                title: 'a'.repeat(ITEMS_LIMITS.TITLE.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Title is too short', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
                title: 'a'.repeat(ITEMS_LIMITS.TITLE.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Title is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
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
                ...itemsSeed.itemInput,
                description: 'a'.repeat(ITEMS_LIMITS.DESCRIPTION.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Description is too short', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
                description: 'a'.repeat(ITEMS_LIMITS.DESCRIPTION.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Description is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
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
                ...itemsSeed.itemInput,
                category: 'a'.repeat(ITEMS_LIMITS.CATEGORY.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Category is too short', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
                category: 'a'.repeat(ITEMS_LIMITS.CATEGORY.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Category is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
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
                ...itemsSeed.itemInput,
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
                ...itemsSeed.itemInput,
                tags: Array.from(
                    { length: ITEMS_LIMITS.TAGS.MAX_ARRAY_SIZE + 1 },
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
                ...itemsSeed.itemInput,
                tags: ['a'.repeat(ITEMS_LIMITS.TAGS.TAG_MIN_LENGTH - 1)],
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Tag item is too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
                tags: ['a'.repeat(ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH + 1)],
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Tag item is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...itemsSeed.itemInput,
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
