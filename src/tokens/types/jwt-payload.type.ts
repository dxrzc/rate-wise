import { JwtPurpose } from 'src/tokens/enums/jwt-purpose.enum';

export type JwtPayload<T extends object> = {
    jti: string;
    exp: number;
    iat: number;
    purpose: JwtPurpose;
} & T;
