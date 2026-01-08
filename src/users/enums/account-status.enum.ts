import { registerEnumType } from '@nestjs/graphql';

export enum AccountStatus {
    ACTIVE = 'active',
    PENDING_VERIFICATION = 'pending_verification',
    SUSPENDED = 'suspended',
}

registerEnumType(AccountStatus, {
    name: 'AccountStatus',
    description: 'Available statuses for an account.',
    valuesMap: {
        ACTIVE: {
            description: 'Account is active and fully verified. User has access to all platform features.',
        },
        PENDING_VERIFICATION: {
            description: 'Account has been registered but has not yet verified their email address.',
        },
        SUSPENDED: {
            description: 'Account has been suspended by a moderator and has restricted access to platform features.',
        },
    },
});
