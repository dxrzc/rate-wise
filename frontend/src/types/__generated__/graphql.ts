/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
    | T
    | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** Available statuses for an account. */
export type AccountStatus =
    /** Account is active and fully verified. User has access to all platform features. */
    | 'ACTIVE'
    /** Account has been registered but has not yet verified their email address. */
    | 'PENDING_VERIFICATION'
    /** Account has been suspended by a moderator and has restricted access to platform features. */
    | 'SUSPENDED';

/** Input data required for user sign-in. */
export type SignInInput = {
    /** The email address of the user. */
    email: string;
    /** The password of the user. */
    password: string;
};

/** Available roles for a user. */
export type UserRole =
    /** Administrator with full access. */
    | 'ADMIN'
    /** User who can create new items (businesses/products). (Default) */
    | 'CREATOR'
    /** User with moderation capabilities. */
    | 'MODERATOR'
    /** Regular user who can write reviews and rate items. (Default) */
    | 'REVIEWER';

export type SignInMutationVariables = Exact<{
    credentials: SignInInput;
}>;

export type SignInMutation = {
    signIn: {
        __typename: 'AccountModel';
        id: string;
        createdAt: unknown;
        updatedAt: unknown;
        username: string;
        email: string;
        roles: Array<UserRole>;
        status: AccountStatus;
    };
};
