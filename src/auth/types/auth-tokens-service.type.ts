import { TokensService } from 'src/tokens/tokens.service';

// All the tokens used in authentication contain the user id in payload
export type AuthTokenService = TokensService<{ id: string }>;
