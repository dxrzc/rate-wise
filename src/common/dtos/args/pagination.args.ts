import { IsInt, IsOptional, IsString } from 'class-validator';
import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PaginationArgs {
    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true })
    cursor!: string;

    @IsInt()
    @Field(() => Int)
    limit!: number;
}
