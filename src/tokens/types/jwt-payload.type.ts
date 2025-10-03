import { JwtPurpose } from 'src/common/enum/jwt.purpose.enum';

export type JwtPayload<T extends object> = {
    jti: string;
    exp: number;
    iat: number;
    purpose: JwtPurpose;
} & T;
