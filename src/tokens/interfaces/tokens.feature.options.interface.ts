import { StringValue } from 'src/common/types/others/string-value.type';
import { JwtPurpose } from 'src/tokens/enums/jwt-purpose.enum';

export interface ITokensFeatureOptions {
    secret: string;
    expiresIn: StringValue;
    purpose: JwtPurpose;
    dataInToken: string[];
}
