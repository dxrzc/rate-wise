import { AccountStatus } from 'src/users/enums/account-status.enum';

const sortedRoles = [
    AccountStatus.SUSPENDED,
    AccountStatus.PENDING_VERIFICATION,
    AccountStatus.ACTIVE,
];

export function isAccountStatusAllowed(
    minAccountStatus: AccountStatus,
    userAccountStatus: AccountStatus,
): boolean {
    const userAccountStatusIndex = sortedRoles.indexOf(userAccountStatus);
    const minAccountStatusIndex = sortedRoles.indexOf(minAccountStatus);
    if (userAccountStatusIndex === -1 || minAccountStatusIndex === -1) return false;
    return userAccountStatusIndex >= minAccountStatusIndex;
}
