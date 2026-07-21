import { TokensService } from 'src/tokens/tokens.service';

/**
 * Defines a token service containing the user id in paylaod
 */
export type AuthTokenService = TokensService<{ id: string }>;
