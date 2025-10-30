export function requestAccountVerification() {
    return {
        query: `
        mutation Mutation {
            requestAccountVerification
        }
        `,
        variables: {},
    };
}
