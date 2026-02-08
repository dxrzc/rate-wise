import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { mock } from 'jest-mock-extended';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { ReviewDataGenerator } from 'src/seed/generators/review-data.generator';
import { CreateReviewInput } from 'src/reviews/graphql/inputs/create-review.input';
import { REVIEWS_RULES } from 'src/reviews/policy/reviews.rules';

const pipe = new AppValidationPipe(mock<HttpLoggerService>());
const reviewDataGenerator = new ReviewDataGenerator();
const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreateReviewInput,
};

describe('CreateReviewInput', () => {
    describe('Rating exceeds the maximum value', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                rating: REVIEWS_RULES.RATING.MAX + 1,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Rating is less than the minimum value', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                rating: REVIEWS_RULES.RATING.MIN - 1,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Rating is not a number', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                rating: 'not-a-number',
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Rating is not an integer', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                rating: 4.5,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Rating is not provided', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                rating: undefined,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Content exceeds the maximum length', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                content: 'a'.repeat(REVIEWS_RULES.CONTENT.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Content is less than the minimum length', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                content: 'a'.repeat(REVIEWS_RULES.CONTENT.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Content is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                content: 12345,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Content is not provided', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                content: undefined,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Content contains leading and trailing spaces', () => {
        test('trim leading and trailing spaces from content', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                content: '  some content  ',
            };
            const result = await pipe.transform(data, metadata);
            expect(result.content).toBe('some content');
        });
    });

    describe('Item id is not a string', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                itemId: 12345,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Item id is not provided', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                itemId: undefined,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Item id is not a valid uuid', () => {
        test('should succeed and not throw', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                itemId: 'invalid-uuid',
            };
            const result = await pipe.transform(data, metadata);
            expect(result.itemId).toBe('invalid-uuid');
        });
    });

    describe('Unexpected property provided', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
                unexpectedProp: 'unexpected',
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Validation success', () => {
        test('return the same data provided by the user', async () => {
            const data = {
                ...reviewDataGenerator.reviewInput,
            };
            const result = await pipe.transform(data, metadata);
            expect(result).toStrictEqual(data);
        });
    });
});
