import { testKit } from '@integration/utils/test-kit.util';
import { ACCOUNT_DELETION_TOKEN } from 'src/auth/constants/tokens.provider.constant';
import { IAccDeletionTokenPayload } from 'src/auth/interfaces/tokens-payload.interface';
import { TokensService } from 'src/tokens/tokens.service';

describe(`GET ${testKit.endpointsREST.deleteAccount}?token=...`, () => {
    let tokenSvc: TokensService<IAccDeletionTokenPayload>;

    beforeAll(() => {
        tokenSvc = testKit.app.get<TokensService<IAccDeletionTokenPayload>>(ACCOUNT_DELETION_TOKEN);
    });

    describe('Account successfully deleted', () => {});
});
