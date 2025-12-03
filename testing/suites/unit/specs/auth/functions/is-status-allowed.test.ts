import { isAccountStatusAllowed } from 'src/auth/functions/is-status-allowed';
import { AccountStatus } from 'src/users/enums/account-status.enum';

describe('isAccountStatusAllowed', () => {
    test('allow when user status is equal to minimum required', () => {
        expect(isAccountStatusAllowed(AccountStatus.ACTIVE, AccountStatus.ACTIVE)).toBe(true);

        expect(
            isAccountStatusAllowed(
                AccountStatus.PENDING_VERIFICATION,
                AccountStatus.PENDING_VERIFICATION,
            ),
        ).toBe(true);

        expect(isAccountStatusAllowed(AccountStatus.SUSPENDED, AccountStatus.SUSPENDED)).toBe(true);
    });

    test('allow when user status is higher than minimum required', () => {
        // ACTIVE > PENDING_VERIFICATION
        expect(
            isAccountStatusAllowed(AccountStatus.PENDING_VERIFICATION, AccountStatus.ACTIVE),
        ).toBe(true);

        // ACTIVE > SUSPENDED
        expect(isAccountStatusAllowed(AccountStatus.SUSPENDED, AccountStatus.ACTIVE)).toBe(true);

        // PENDING_VERIFICATION > SUSPENDED
        expect(
            isAccountStatusAllowed(AccountStatus.SUSPENDED, AccountStatus.PENDING_VERIFICATION),
        ).toBe(true);
    });

    test('deny when user status is lower than minimum required', () => {
        // PENDING_VERIFICATION < ACTIVE
        expect(
            isAccountStatusAllowed(AccountStatus.ACTIVE, AccountStatus.PENDING_VERIFICATION),
        ).toBe(false);

        // SUSPENDED < ACTIVE
        expect(isAccountStatusAllowed(AccountStatus.ACTIVE, AccountStatus.SUSPENDED)).toBe(false);

        // SUSPENDED < PENDING_VERIFICATION
        expect(
            isAccountStatusAllowed(AccountStatus.PENDING_VERIFICATION, AccountStatus.SUSPENDED),
        ).toBe(false);
    });

    test('return false if either status is not found in sortedRoles', () => {
        expect(isAccountStatusAllowed('invalid' as any, AccountStatus.ACTIVE)).toBe(false);
        expect(isAccountStatusAllowed(AccountStatus.ACTIVE, 'invalid' as any)).toBe(false);
    });
});
