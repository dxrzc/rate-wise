import { JwtType } from 'src/common/enum/jwt.type.enum';

export interface ITokensOptions {
    secret: string;
    expiresIn: string;
    type: JwtType;
}
