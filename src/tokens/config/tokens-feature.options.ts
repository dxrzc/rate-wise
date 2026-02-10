import { StringValue } from 'src/common/types/string-value.type';
import { JwtPurpose } from 'src/tokens/enums/jwt-purpose.enum';

export interface ITokensFeatureOptions {
    readonly secret: string;
    readonly expiresIn: StringValue;
    readonly purpose: JwtPurpose;
    readonly dataInToken: string[];
}
