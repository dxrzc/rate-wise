import { ITestKit } from '../interfaces/test-kit.interface';

export const testKit: ITestKit = {
    endpointsREST: {
        verifyAccount: '/auth/verify-account',
        deleteAccount: '/auth/delete-account',
        signOutAll: '/auth/sign-out-all',
    },
} as ITestKit;
