import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/users/enums/user-role.enum';
import { SignUpInput } from 'src/auth/graphql/inputs/sign-up.input';
import { AUTH_RULES } from 'src/auth/constants/auth.rules';

@Injectable()
export class UserSeedService {
    get username(): string {
        const randomNumber = faker.number.int({ max: 100 });
        const baseUsername =
            randomNumber % 2 === 0
                ? `${faker.person.firstName()}_${randomNumber}${faker.person.lastName()}`
                : `${faker.person.lastName()}_${randomNumber}${faker.person.firstName()}`;

        // Ensure username does not exceed AUTH_LIMITS.USERNAME.MAX
        return baseUsername.slice(0, AUTH_RULES.USERNAME.MAX);
    }

    get email(): string {
        return faker.internet.email();
    }

    get role(): UserRole {
        const roles = Object.values(UserRole);
        return roles[faker.number.int({ min: 0, max: roles.length - 1 })] as UserRole;
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
            role: this.role,
        };
    }
}
