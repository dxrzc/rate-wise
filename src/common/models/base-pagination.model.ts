import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { IPaginatedType } from '../interfaces/paginated-type.interface';

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
    @ObjectType(`${classRef.name}Edge`)
    abstract class EdgeType {
        @Field(() => String)
        cursor!: string;

        @Field(() => classRef)
        node!: T;
    }

    @ObjectType({ isAbstract: true })
    abstract class PaginatedType implements IPaginatedType<T> {
        @Field(() => [EdgeType], { nullable: true })
        edges!: EdgeType[];

        @Field(() => [classRef], { nullable: true })
        nodes!: T[];

        @Field(() => Int)
        totalCount!: number;

        @Field()
        hasNextPage!: boolean;
    }
    return PaginatedType as Type<IPaginatedType<T>>;
}
