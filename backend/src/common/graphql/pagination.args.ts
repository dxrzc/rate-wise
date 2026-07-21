import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { PAGINATION_RULES } from 'src/common/pagination/pagination.rules';

@ArgsType()
export class PaginationArgs {
    @IsString()
    @IsOptional()
    @Field(() => String, {
        nullable: true,
        description: `
            Cursor for pagination to fetch results after this cursor.
        `,
    })
    cursor?: string;

    @IsInt()
    @Min(PAGINATION_RULES.MIN)
    @Max(PAGINATION_RULES.MAX)
    @Field(() => Int, {
        description: `
        Number of items to retrieve per page.                
        - **Minimum value:** 1.
        - **Maximum value:** 100.
        `,
        nullable: true,
        defaultValue: PAGINATION_RULES.DEFAULT,
    })
    limit!: number;
}
