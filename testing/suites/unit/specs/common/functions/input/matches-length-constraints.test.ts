import { matchesLengthConstraints } from 'src/common/functions/input/matches-length-constraints';

describe('matchesConstraints', () => {
    test('return true when no constraints are provided', () => {
        expect(matchesLengthConstraints('hello', {})).toBe(true);
    });

    describe('MIN constraint', () => {
        test('return false when input length is less than MIN', () => {
            expect(matchesLengthConstraints('hi', { MIN: 5 })).toBe(false);
        });

        test('return true when input length equals MIN', () => {
            expect(matchesLengthConstraints('hello', { MIN: 5 })).toBe(true);
        });

        test('return true when input length is greater than MIN', () => {
            expect(matchesLengthConstraints('hello world', { MIN: 5 })).toBe(true);
        });
    });

    describe('MAX constraint', () => {
        test('return false when input length is greater than MAX', () => {
            expect(matchesLengthConstraints('hello world', { MAX: 5 })).toBe(false);
        });

        test('return true when input length equals MAX', () => {
            expect(matchesLengthConstraints('hello', { MAX: 5 })).toBe(true);
        });

        test('return true when input length is less than MAX', () => {
            expect(matchesLengthConstraints('hi', { MAX: 5 })).toBe(true);
        });
    });

    describe('MIN and MAX constraints together', () => {
        test('return true when input length is within range', () => {
            expect(matchesLengthConstraints('hello', { MIN: 3, MAX: 10 })).toBe(true);
        });

        test('return false when input length is below MIN', () => {
            expect(matchesLengthConstraints('hi', { MIN: 3, MAX: 10 })).toBe(false);
        });

        test('return false when input length is above MAX', () => {
            expect(matchesLengthConstraints('this is too long', { MIN: 3, MAX: 10 })).toBe(false);
        });

        test('return true when input length equals both MIN and MAX', () => {
            expect(matchesLengthConstraints('abc', { MIN: 3, MAX: 3 })).toBe(true);
        });
    });

    describe('edge cases', () => {
        test('handles empty string with no constraints', () => {
            expect(matchesLengthConstraints('', {})).toBe(true);
        });

        test('handles empty string with MIN = 0', () => {
            expect(matchesLengthConstraints('', { MIN: 0 })).toBe(true);
        });

        test('handles empty string with MIN > 0', () => {
            expect(matchesLengthConstraints('', { MIN: 1 })).toBe(false);
        });
    });
});
