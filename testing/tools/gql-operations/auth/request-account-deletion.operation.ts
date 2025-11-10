export function requestAccountDeletion() {
    return {
        query: `
        mutation Mutation {
            requestAccountDeletion
        }
        `,
        variables: {},
    };
}
