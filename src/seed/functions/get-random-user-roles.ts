import { UserRole } from 'src/users/enums/user-role.enum';

export function getRandomUserRoles(): UserRole[] {
    const roles = Object.values(UserRole);
    // randomly decide how many roles
    const count = Math.floor(Math.random() * roles.length) + 1;
    // shuffle and take the first "count"
    const shuffled = roles.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
