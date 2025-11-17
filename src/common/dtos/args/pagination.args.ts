import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PaginationArgs {
    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true })
    cursor!: string;

    @IsInt()
    @MinLength(1)
    @MaxLength(100)
    @Field(() => Int, {
        description: `Max length: **100**`,
    })
    limit!: number;
}
