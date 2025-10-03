import { JwtPurpose } from 'src/common/enum/jwt.purpose.enum';

export interface ITokensOptions {
    secret: string;
    expiresIn: string;
    purpose: JwtPurpose;
    dataInToken: string[];
}
