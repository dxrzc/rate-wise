import { Field, ObjectType } from '@nestjs/graphql';

export function BasePaginationModel<T>(classRef: T): any {
    @ObjectType({ isAbstract: true })
    abstract class Pagination {
        @Field(() => [classRef])
        data!: T[];

        @Field(() => String, { nullable: true })
        nextCursor!: string;
    }
    return Pagination;
}
