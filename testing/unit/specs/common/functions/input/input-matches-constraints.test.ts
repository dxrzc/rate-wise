import { matchesConstraints } from 'src/common/functions/input/input-matches-constraints';

describe('matchesConstraints', () => {
    test('returns true when no constraints are provided', () => {
        expect(matchesConstraints('hello', {})).toBe(true);
    });

    describe('MIN constraint', () => {
        test('returns false when input length is less than MIN', () => {
            expect(matchesConstraints('hi', { MIN: 5 })).toBe(false);
        });

        test('returns true when input length equals MIN', () => {
            expect(matchesConstraints('hello', { MIN: 5 })).toBe(true);
        });

        test('returns true when input length is greater than MIN', () => {
            expect(matchesConstraints('hello world', { MIN: 5 })).toBe(true);
        });
    });

    describe('MAX constraint', () => {
        test('returns false when input length is greater than MAX', () => {
            expect(matchesConstraints('hello world', { MAX: 5 })).toBe(false);
        });

        test('returns true when input length equals MAX', () => {
            expect(matchesConstraints('hello', { MAX: 5 })).toBe(true);
        });

        test('returns true when input length is less than MAX', () => {
            expect(matchesConstraints('hi', { MAX: 5 })).toBe(true);
        });
    });

    describe('MIN and MAX constraints together', () => {
        test('returns true when input length is within range', () => {
            expect(matchesConstraints('hello', { MIN: 3, MAX: 10 })).toBe(true);
        });

        test('returns false when input length is below MIN', () => {
            expect(matchesConstraints('hi', { MIN: 3, MAX: 10 })).toBe(false);
        });

        test('returns false when input length is above MAX', () => {
            expect(
                matchesConstraints('this is too long', { MIN: 3, MAX: 10 }),
            ).toBe(false);
        });

        test('returns true when input length equals both MIN and MAX', () => {
            expect(matchesConstraints('abc', { MIN: 3, MAX: 3 })).toBe(true);
        });
    });

    describe('edge cases', () => {
        test('handles empty string with no constraints', () => {
            expect(matchesConstraints('', {})).toBe(true);
        });

        test('handles empty string with MIN = 0', () => {
            expect(matchesConstraints('', { MIN: 0 })).toBe(true);
        });

        test('handles empty string with MIN > 0', () => {
            expect(matchesConstraints('', { MIN: 1 })).toBe(false);
        });
    });
});
