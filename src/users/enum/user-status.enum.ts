import { registerEnumType } from '@nestjs/graphql';

export enum UserStatus {
    ACTIVE = 'active',
    PENDING_VERIFICATION = 'pending_verification',
    SUSPENDED = 'suspended',
}

registerEnumType(UserStatus, {
    name: 'UserStatus',
    description: 'Available statuses for a user.',
    valuesMap: {
        ACTIVE: {
            description: 'User is active and can log in.',
        },
        PENDING_VERIFICATION: {
            description:
                'User has registered but not yet verified their email.',
        },
        SUSPENDED: {
            description: 'User account has been suspended.',
        },
    },
});
