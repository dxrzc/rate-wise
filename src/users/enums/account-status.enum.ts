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
            description: 'Account is active and user can log in.',
        },
        PENDING_VERIFICATION: {
            description:
                'Account has been registered but not yet verified their email.',
        },
        SUSPENDED: {
            description: 'Account has been suspended.',
        },
    },
});
