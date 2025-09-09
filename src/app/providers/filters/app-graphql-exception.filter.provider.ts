import { GraphQLErrorFilter } from 'src/common/filters/graphql-exception.filter';
import { APP_FILTER } from '@nestjs/core';

export const appGraphqlExceptionFilter = {
    provide: APP_FILTER,
    useClass: GraphQLErrorFilter,
};
