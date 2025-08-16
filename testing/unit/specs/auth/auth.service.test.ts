import { ServerConfigService } from 'src/config/services/server-config.service';
import { INVALID_CREDENTIALS } from 'src/auth/constants/errors.constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { USER_NOT_FOUND } from 'src/users/constants/errors.constants';
import { hashSync, genSaltSync, compareSync } from 'bcryptjs';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { SignInInput } from 'src/auth/dtos/sign-in.input';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { AuthService } from 'src/auth/auth.service';
import { faker } from '@faker-js/faker/.';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('First unit test', () => {
    const serverConfig: Pick<ServerConfigService, 'bcryptSaltRounds'> = {
        bcryptSaltRounds: 1,
    };

    let userReposMock: MockProxy<Repository<User>>;
    let authService: AuthService;

    beforeEach(async () => {
        userReposMock = mock<Repository<User>>();
        const moduleRef = await Test.createTestingModule({
            providers: [AuthService, UsersService],
        })
            .useMocker((token) => {
                if (token === getRepositoryToken(User)) return userReposMock;
                if (token === ServerConfigService) return serverConfig;
            })
            .compile();

        authService = moduleRef.get(AuthService);
    });

    describe('signUp', () => {
        test('encrypt the user password before saving', async () => {
            const password = faker.internet.password();
            await authService.signUp({ password } as SignUpInput);
            const savedPassword = (
                userReposMock.save.mock.calls[0][0] as unknown as SignUpInput
            ).password;
            expect(compareSync(password, savedPassword)).toBeTruthy();
        });
    });

    describe('reAuthenticate', () => {
        describe('Password does not match the user found', () => {
            test('should return BadRequestException INVALID_CREDENTIALS', async () => {
                // mock: user found
                const user = { password: 'test', id: uuidv4() } as User;
                userReposMock.findOneBy.mockResolvedValue(user);
                await expect(
                    authService.reAuthenticate(user.id, user.password),
                ).rejects.toThrow(new BadRequestException(INVALID_CREDENTIALS));
            });
        });

        describe('Password matches the user credentials', () => {
            test('should not throw', async () => {
                const rawPassword = faker.internet.password();
                const user = {
                    id: uuidv4(),
                    password: hashSync(
                        rawPassword,
                        genSaltSync(serverConfig.bcryptSaltRounds),
                    ),
                } as User;
                // mock: user found
                userReposMock.findOneBy.mockResolvedValue(user);
                await expect(
                    authService.reAuthenticate(user.id, rawPassword),
                ).resolves.not.toThrow();
            });
        });

        describe('User not found', () => {
            test('throw NotFoundException USER_NOT_FOUND', async () => {
                const validUUid = uuidv4();
                // mock: no user found
                userReposMock.findOneBy.mockResolvedValue(null);
                await expect(
                    authService.reAuthenticate(validUUid, 'key'),
                ).rejects.toThrow(new NotFoundException(USER_NOT_FOUND));
            });
        });

        describe('Invalid uuid', () => {
            test('throw NotFoundException USER_NOT_FOUND', async () => {
                const invalidUuid = '123';
                // mock: user found
                userReposMock.findOneBy.mockResolvedValue({} as User);
                await expect(
                    authService.reAuthenticate(invalidUuid, 'key'),
                ).rejects.toThrow(new NotFoundException(USER_NOT_FOUND));
            });
        });
    });

    describe('signIn', () => {
        describe('User not found', () => {
            test('throw BadRequestException INVALID_CREDENTIALS', async () => {
                // mock: no user found
                userReposMock.findOneBy.mockResolvedValue(null);
                await expect(
                    authService.signIn({} as SignInInput),
                ).rejects.toThrow(new BadRequestException(INVALID_CREDENTIALS));
            });
        });

        describe('Credentials does not match', () => {
            test('throw BadRequestException INVALID_CREDENTIALS', async () => {
                // mock: user found
                const user = { password: 'test' } as User;
                userReposMock.findOneBy.mockResolvedValue(user);
                const credentials = { password: 'bad password' } as SignInInput;
                await expect(authService.signIn(credentials)).rejects.toThrow(
                    new BadRequestException(INVALID_CREDENTIALS),
                );
            });
        });

        describe('User found', () => {
            describe('Credentials match', () => {
                test('return the user', async () => {
                    const rawPassword = faker.internet.password();
                    const user = {
                        email: faker.internet.email(),
                        password: hashSync(
                            rawPassword,
                            genSaltSync(serverConfig.bcryptSaltRounds),
                        ),
                    } as User;
                    // mock: user found
                    userReposMock.findOneBy.mockResolvedValue(user);
                    await expect(
                        authService.signIn({
                            email: user.email,
                            password: rawPassword,
                        }),
                    ).resolves.toBe(user);
                });
            });
        });
    });
});
