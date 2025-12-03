import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString } from 'class-validator';

// TODO: add a base class for pagination
@InputType({
    description: 'Filters for querying items by category and/or tags.',
})
export class ItemFilterArgs {
    @Field({
        nullable: true,
        description: 'Filter items by category name.',
    })
    @IsOptional()
    @IsString()
    category?: string;

    @Field(() => [String], {
        nullable: true,
        description: 'Filter items by a list of tags.',
    })
    @IsOptional()
    @IsArray()
    tags?: string[];
}
