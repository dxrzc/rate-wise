import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/users/enums/user-role.enum';
import { SignUpInput } from 'src/auth/graphql/inputs/sign-up.input';
import { AUTH_RULES } from 'src/auth/policy/auth.rules';
import { AccountStatus } from 'src/users/enums/account-status.enum';

@Injectable()
export class UserDataGenerator {
    get username(): string {
        const randomNumber = faker.number.int({ max: 100 });
        const baseUsername =
            randomNumber % 2 === 0
                ? `${faker.person.firstName()}_${randomNumber}${faker.person.lastName()}`
                : `${faker.person.lastName()}_${randomNumber}${faker.person.firstName()}`;

        // Ensure username does not exceed AUTH_RULES.USERNAME.MAX
        return baseUsername.slice(0, AUTH_RULES.USERNAME.MAX);
    }

    get email(): string {
        return faker.internet.email();
    }

    get role(): UserRole {
        const roles = Object.values(UserRole);
        return roles[faker.number.int({ min: 0, max: roles.length - 1 })] as UserRole;
    }

    get roles(): UserRole[] {
        const roles = Object.values(UserRole);
        // randomly decide how many roles
        const count = Math.floor(Math.random() * roles.length) + 1;
        // shuffle and take the first "count"
        const shuffled = roles.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    get accountStatus(): AccountStatus {
        const statuses = Object.values(AccountStatus);
        const randomIndex = Math.floor(Math.random() * statuses.length);
        return statuses[randomIndex];
    }

    get password(): string {
        const randomNumber = faker.number.int({ max: 4 });
        return faker.internet.password({
            length: AUTH_RULES.PASSWORD.MAX - randomNumber,
        });
    }

    get signUpInput(): SignUpInput {
        return {
            email: this.email,
            username: this.username,
            password: this.password,
        };
    }

    get user() {
        const { password: passwordHash, ...signUpInput } = this.signUpInput;
        return {
            ...signUpInput,
            passwordHash,
            role: this.roles,
            status: this.accountStatus,
        };
    }
}
