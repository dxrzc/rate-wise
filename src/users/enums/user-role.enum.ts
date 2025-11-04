import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
    USER = 'user',
    MODERATOR = 'moderator',
    ADMIN = 'admin',
}

registerEnumType(UserRole, {
    name: 'UserRole',
    description: 'Available roles for a user.',
    valuesMap: {
        USER: {
            description: 'Regular user with basic permissions.',
        },
        MODERATOR: {
            description: 'User with moderation capabilities.',
        },
        ADMIN: {
            description: 'Administrator with full access.',
        },
    },
});
