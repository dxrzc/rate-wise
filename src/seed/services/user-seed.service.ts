import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/users/enums/user-role.enum';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';

@Injectable()
export class UserSeedService {
    get username(): string {
        const randomNumber = faker.number.int({ max: 100 });
        const baseUsername =
            randomNumber % 2 === 0
                ? `${faker.person.firstName()}_${randomNumber}${faker.person.lastName()}`
                : `${faker.person.lastName()}_${randomNumber}${faker.person.firstName()}`;

        // Ensure username does not exceed AUTH_LIMITS.USERNAME.MAX
        return baseUsername.slice(0, AUTH_LIMITS.USERNAME.MAX);
    }

    get email(): string {
        // Regenerate email until we get one that fits within the max length
        let email = faker.internet.email();
        while (email.length > AUTH_LIMITS.EMAIL.MAX) {
            email = faker.internet.email();
        }
        return email;
    }

    get role(): UserRole {
        const roles = Object.values(UserRole);
        return roles[faker.number.int({ min: 0, max: roles.length - 1 })] as UserRole;
    }

    get password(): string {
        const randomNumber = faker.number.int({ max: 4 });
        return faker.internet.password({
            length: AUTH_LIMITS.PASSWORD.MAX - randomNumber,
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
        return {
            ...this.signUpInput,
            role: this.role,
        };
    }
}
