export function createQuery(query: string, input: Record<string, any>) {
    return {
        query,
        variables: { input },
    };
}
