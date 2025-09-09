import { GqlExceptionFilter } from '@nestjs/graphql';
import { Catch } from '@nestjs/common';
import { GraphQLError } from 'graphql';

@Catch(GraphQLError)
export class GraphQLErrorFilter implements GqlExceptionFilter {
    catch(exception: GraphQLError) {
        // just rethrow so Apollo handles it, without Nest logging as error
        return exception;
    }
}
