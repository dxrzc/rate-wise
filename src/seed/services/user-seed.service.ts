import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/users/enums/user-role.enum';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';

@Injectable()
export class UserSeedService {
    get username(): string {
        const randomNumber = faker.number.int({ max: 100 });
        return randomNumber % 2 === 0
            ? `${faker.person.firstName()}_${randomNumber}${faker.person.lastName()}`
            : `${faker.person.lastName()}_${randomNumber}${faker.person.firstName()}`;
    }

    get email(): string {
        return faker.internet.email();
    }

    get role(): UserRole {
        const roles = Object.values(UserRole);
        return roles[
            faker.number.int({ min: 0, max: roles.length - 1 })
        ] as UserRole;
    }

    get reputationScore(): number {
        return faker.number.int({ min: 0, max: 10000 });
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
            reputationScore: this.reputationScore,
        };
    }
}
