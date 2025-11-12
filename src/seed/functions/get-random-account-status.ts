import { AccountStatus } from 'src/users/enums/account-status.enum';

export function getRandomAccountStatus(): AccountStatus {
    const statuses = Object.values(AccountStatus);
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex];
}
