export function signOut() {
    return {
        query: `
        mutation Mutation {
            signOut
        }
        `,
        variables: {},
    };
}
