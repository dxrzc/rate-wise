export async function runSettledOrThrow<T = unknown[]>(promises: Promise<unknown>[]) {
    const results = await Promise.allSettled(promises);
    const rejection = results.find((r) => r.status === 'rejected');
    if (rejection) throw rejection.reason;
    // Extract and return only the fulfilled values
    return <T>results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
}
