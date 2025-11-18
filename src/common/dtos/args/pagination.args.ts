import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { PAG_LIMITS } from 'src/common/constants/pagination.constants';

@ArgsType()
export class PaginationArgs {
    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true })
    cursor!: string;

    @IsInt()
    @Min(PAG_LIMITS.MIN)
    @Max(PAG_LIMITS.MAX)
    @Field(() => Int, {
        description: `
        **Constraints:** Minimum value is 1, maximum value is 100.
        `,
    })
    limit!: number;
}
