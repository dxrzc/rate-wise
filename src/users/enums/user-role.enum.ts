import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
    REVIEWER = 'reviewer',
    CREATOR = 'creator',
    MODERATOR = 'moderator',
    ADMIN = 'admin',
}

registerEnumType(UserRole, {
    name: 'UserRole',
    description: 'Available roles for a user.',
    valuesMap: {
        REVIEWER: {
            description: 'Regular user who can write reviews and rate items. (Default)',
        },
        CREATOR: {
            description: 'User who can create new items (businesses/products). (Default)',
        },
        MODERATOR: {
            description: 'User with moderation capabilities.',
        },
        ADMIN: {
            description: 'Administrator with full access.',
        },
    },
});
