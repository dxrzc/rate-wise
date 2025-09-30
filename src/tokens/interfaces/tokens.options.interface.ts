import { TokenType } from '../enum/token-type.enum';

export interface ITokensOptions {
    secret: string;
    expiresIn: string;
    type: TokenType;
}
