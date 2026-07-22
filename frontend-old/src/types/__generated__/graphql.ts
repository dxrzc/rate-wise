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

/** Input type for creating a new item */
export type CreateItemInput = {
    /** The category of the item. Minimum length: 3, Maximum length: 40. */
    category: string;
    /** A detailed description of the item. Minimum length: 5, Maximum length: 500. */
    description: string;
    /** Optional tags for the item. Maximum 10 tags, each between 2-20 characters. */
    tags?: Array<string> | null | undefined;
    /** The title of the item. Minimum length: 5, Maximum length: 40. */
    title: string;
};

/** Input data required for user sign-in. */
export type SignInInput = {
    /** The email address of the user. */
    email: string;
    /** The password of the user. */
    password: string;
};

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

export type RequestAccountVerificationMutationVariables = Exact<{ [key: string]: never }>;

export type RequestAccountVerificationMutation = { requestAccountVerification: boolean };

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

export type SignUpMutationVariables = Exact<{
    userData: SignUpInput;
}>;

export type SignUpMutation = { signUp: { __typename: 'AccountModel'; email: string } };

export type CreateItemMutationVariables = Exact<{
    item_data: CreateItemInput;
}>;

export type CreateItemMutation = { createItem: { __typename: 'ItemModel'; id: string } };
