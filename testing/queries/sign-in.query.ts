export const signInQuery = `
mutation SignIn($input: SignInInput!) {
  signIn(credentials: $input) {
    id
    createdAt
    updatedAt
    username
    email
    status
    role
    reputationScore
  }
}
`;
