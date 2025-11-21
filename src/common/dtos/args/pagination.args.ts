import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { PAG_LIMITS } from 'src/common/constants/pagination.constants';

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
    @Min(PAG_LIMITS.MIN)
    @Max(PAG_LIMITS.MAX)
    @Field(() => Int, {
        description: `
        Number of items to retrieve per page.                
        - **Minimum value:** 1.
        - **Maximum value:** 100.
        `,
    })
    limit!: number;
}
