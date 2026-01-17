import { JwtPurpose } from 'src/tokens/enums/jwt-purpose.enum';

export type JwtPayload<T extends object> = {
    readonly jti: string;
    readonly exp: number;
    readonly iat: number;
    readonly purpose: JwtPurpose;
} & Readonly<T>;
