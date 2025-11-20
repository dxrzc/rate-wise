import { getRandomUserRoles } from 'src/seed/functions/get-random-user-roles';
import { createAccount } from './create-account.util';
import { getRandomAccountStatus } from 'src/seed/functions/get-random-account-status';

/**
 * @param n Number of accounts to create.
 * @returns Array containig the ids of the created users.
 */
export async function createManyAccounts(n: number): Promise<string[]> {
    const promises: ReturnType<typeof createAccount>[] = [];
    for (let i = 0; i < n; i++)
        promises.push(
            createAccount({
                status: getRandomAccountStatus(),
                roles: getRandomUserRoles(),
            }),
        ); // TODO: random role
    const usersCreated = await Promise.all(promises);
    return usersCreated.map((user) => user.id);
}
