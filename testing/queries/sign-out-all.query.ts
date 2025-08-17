export const signOutAllQuery = `
mutation SignOutAll($input: ReAuthenticationInput!) {
  signOutAll(password: $input)
}
`;
