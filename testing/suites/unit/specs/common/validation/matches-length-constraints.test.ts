import { lengthMatcher } from 'src/common/validation/lenght-matcher';

describe('lengthMatcher', () => {
    test('return true when no constraints are provided', () => {
        expect(lengthMatcher('hello', {})).toBe(true);
    });

    describe('MIN constraint', () => {
        test('return false when input length is less than MIN', () => {
            expect(lengthMatcher('hi', { MIN: 5 })).toBe(false);
        });

        test('return true when input length equals MIN', () => {
            expect(lengthMatcher('hello', { MIN: 5 })).toBe(true);
        });

        test('return true when input length is greater than MIN', () => {
            expect(lengthMatcher('hello world', { MIN: 5 })).toBe(true);
        });
    });

    describe('MAX constraint', () => {
        test('return false when input length is greater than MAX', () => {
            expect(lengthMatcher('hello world', { MAX: 5 })).toBe(false);
        });

        test('return true when input length equals MAX', () => {
            expect(lengthMatcher('hello', { MAX: 5 })).toBe(true);
        });

        test('return true when input length is less than MAX', () => {
            expect(lengthMatcher('hi', { MAX: 5 })).toBe(true);
        });
    });

    describe('MIN and MAX constraints together', () => {
        test('return true when input length is within range', () => {
            expect(lengthMatcher('hello', { MIN: 3, MAX: 10 })).toBe(true);
        });

        test('return false when input length is below MIN', () => {
            expect(lengthMatcher('hi', { MIN: 3, MAX: 10 })).toBe(false);
        });

        test('return false when input length is above MAX', () => {
            expect(lengthMatcher('this is too long', { MIN: 3, MAX: 10 })).toBe(false);
        });

        test('return true when input length equals both MIN and MAX', () => {
            expect(lengthMatcher('abc', { MIN: 3, MAX: 3 })).toBe(true);
        });
    });

    describe('edge cases', () => {
        test('handles empty string with no constraints', () => {
            expect(lengthMatcher('', {})).toBe(true);
        });

        test('handles empty string with MIN = 0', () => {
            expect(lengthMatcher('', { MIN: 0 })).toBe(true);
        });

        test('handles empty string with MIN > 0', () => {
            expect(lengthMatcher('', { MIN: 1 })).toBe(false);
        });
    });
});
