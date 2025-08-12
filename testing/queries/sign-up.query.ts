export const signUpQuery = `
mutation SignUp($userData: SignUpInput!) {
  signUp(user_data: $userData) {
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
