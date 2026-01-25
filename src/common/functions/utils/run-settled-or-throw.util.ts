export async function runSettledOrThrow<T = unknown[]>(promises: Promise<unknown>[]) {
    const results = await Promise.allSettled(promises);
    const rejections = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (rejections.length === 1) throw rejections[0].reason;
    if (rejections.length > 1) {
        throw new AggregateError(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            rejections.map((r) => r.reason),
            'One or more concurrent operations failed',
        );
    }
    return <T>(
        results
            .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
            .map((r) => r.value)
    );
}
