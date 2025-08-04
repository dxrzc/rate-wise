import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateItemInput {
    @IsString()
    @MinLength(5)
    @MaxLength(20)
    @Field(() => String)
    title!: string;

    @Field(() => String)
    @IsString()
    @MinLength(5)
    @MaxLength(200)
    description!: string;

    @IsString()
    @MinLength(5)
    @MaxLength(20)
    @Field(() => String)
    category!: string;

    @IsArray()
    @ArrayMaxSize(5)
    @ArrayMinSize(1)
    @IsString({ each: true })
    @MinLength(5, { each: true })
    @MaxLength(20, { each: true })
    @Field(() => [String])
    tags!: string[];
}
