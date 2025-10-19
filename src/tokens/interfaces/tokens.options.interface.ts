import { JwtPurpose } from 'src/tokens/enums/jwt-purpose.enum';

export interface ITokensOptions {
    secret: string;
    expiresIn: string;
    purpose: JwtPurpose;
    dataInToken: string[];
}
