import { Type } from '@nestjs/common';
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { IPaginatedType } from '../../pagination/interfaces/paginated-type.interface';

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
    @ObjectType(`${classRef.name}Edge`, {
        description: `Edge type for ${classRef.name} in a paginated list.`,
    })
    abstract class EdgeType {
        @Field(() => String, {
            description: `
                A cursor for pagination pointing to this specific node.
            `,
        })
        cursor!: string;

        @Field(() => classRef, {
            description: `
                The node of type ${classRef.name} contained in this edge.
            `,
        })
        node!: T;
    }

    @ObjectType({ isAbstract: true })
    abstract class PaginatedType implements IPaginatedType<T> {
        @Field(() => [EdgeType], {
            nullable: true,
            description: `
                List of edges in the current page, each containing a cursor and a node of type ${classRef.name}.
            `,
        })
        edges!: EdgeType[];

        @Field(() => [classRef], {
            nullable: true,
            description: `
                List of ${classRef.name} nodes in the current page.
            `,
        })
        nodes!: T[];

        @Field(() => Int, {
            description: `
                The total number of items available across all pages.
            `,
        })
        totalCount!: number;

        @Field({
            description: `
                Indicates if there are more items available after the current page.
            `,
        })
        hasNextPage!: boolean;
    }
    return PaginatedType as Type<IPaginatedType<T>>;
}
