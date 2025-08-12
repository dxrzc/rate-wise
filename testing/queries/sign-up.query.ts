export const signUpQuery = `
mutation SignUp($input: SignUpInput!) {
  signUp(user_data: $input) {
    id
    createdAt
    updatedAt
    username
    email
    role
    reputationScore
  }
}
`;
