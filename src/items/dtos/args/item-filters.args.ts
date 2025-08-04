import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString } from 'class-validator';

// TODO: add a base class for pagination
@InputType()
export class ItemFilterArgs {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    category?: string;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    tags?: string[];
}
