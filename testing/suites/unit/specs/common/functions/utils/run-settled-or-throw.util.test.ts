import { runSettledOrThrow } from 'src/common/functions/utils/run-settled-or-throw.util';

describe('runSettledOrThrow', () => {
    test('resolves with values when all promises fulfill', async () => {
        const promises = [Promise.resolve(1), Promise.resolve('ok'), Promise.resolve({ a: 1 })];
        const result = await runSettledOrThrow(promises);
        expect(result).toEqual([1, 'ok', { a: 1 }]);
    });

    test('throws the original error when exactly one promise rejects', async () => {
        const error = new Error('boom');
        const promises = [Promise.resolve(1), Promise.reject(error), Promise.resolve(3)];
        await expect(runSettledOrThrow(promises)).rejects.toBe(error);
    });

    test('throws AggregateError when more than one promise rejects', async () => {
        const error1 = new Error('first');
        const error2 = new Error('second');
        const promises = [Promise.reject(error1), Promise.resolve(2), Promise.reject(error2)];
        try {
            await runSettledOrThrow(promises);
            fail('Expected runSettledOrThrow to throw');
        } catch (err) {
            expect(err).toBeInstanceOf(AggregateError);
            const aggregate = err as AggregateError;
            expect(aggregate.message).toBe('One or more concurrent operations failed');
            expect(aggregate.errors).toEqual([error1, error2]);
        }
    });

    test('waits for all promises to settle before throwing', async () => {
        const sideEffects: string[] = [];
        const p1: Promise<void> = new Promise((resolve) => {
            setTimeout(() => {
                sideEffects.push('first');
                resolve();
            }, 20);
        });
        const p2: Promise<void> = new Promise((_, reject) => {
            setTimeout(() => {
                sideEffects.push('second');
                reject(new Error('fail'));
            }, 10);
        });
        await expect(runSettledOrThrow([p1, p2])).rejects.toThrow('fail');
        // both promises must have run even though one failed
        expect(sideEffects).toEqual(['second', 'first']);
    });

    test('returns an empty array when given an empty array', async () => {
        const result = await runSettledOrThrow([]);
        expect(result).toEqual([]);
    });
});
