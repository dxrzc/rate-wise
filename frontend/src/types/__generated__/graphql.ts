/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
    T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** Input data required for user sign-up. */
export type SignUpInput = {
    /**
     *
     *             The email address for the account.
     *             - **Must be a valid email format.**
     *
     */
    email: string;
    /**
     *
     *             The password for the account.
     *             - **Minimum length:** 8 characters.
     *             - **Maximum length:** 60 characters.
     *
     */
    password: string;
    /**
     *
     *             The username for the account.
     *             - **Minimum length:** 3 characters.
     *             - **Maximum length:** 30 characters.
     *
     */
    username: string;
};

export type SignUpMutationVariables = Exact<{
    userData: SignUpInput;
}>;

export type SignUpMutation = { signUp: { __typename: 'AccountModel'; email: string } };
