import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<Date, Date | string> {
    description = 'Date custom scalar type';

    parseValue = (value: unknown) => {
        return new Date(<string>value);
    };

    // This makes every cached or DB string become a Date
    serialize = (value: unknown) => {
        if (typeof value === 'string') return new Date(value);
        return <Date>value;
    };

    parseLiteral(ast: ValueNode): Date {
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
        }
        return null as unknown as Date;
    }
}
