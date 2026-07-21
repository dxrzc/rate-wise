export function generateGqlQuery(queryName: string) {
    return `
    query TestQuery {
        ${queryName}
    }
    `;
}
