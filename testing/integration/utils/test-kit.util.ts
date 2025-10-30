import { ITestKit } from '../interfaces/test-kit.interface';

export const testKit: ITestKit = {
    endpointsREST: {
        verifyAccount: '/auth/verifyAccount',
    },
} as ITestKit;
