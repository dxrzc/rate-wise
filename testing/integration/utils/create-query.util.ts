export function createQuery(query: string, input: object) {
    return {
        query,
        variables: { input },
    };
}
