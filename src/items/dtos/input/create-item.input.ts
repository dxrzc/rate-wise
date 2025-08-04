import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Field, InputType } from '@nestjs/graphql';
import { trimAndLowercase } from 'src/common/functions/utils/trim-and-lowercase.util';
import { trimAndLowerCaseArray } from 'src/common/functions/utils/trim-and-lowercase-array.util';

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
    @Transform(trimAndLowercase)
    @Field(() => String)
    category!: string;

    @IsArray()
    @ArrayMaxSize(5)
    @ArrayMinSize(1)
    @IsString({ each: true })
    @MinLength(2, { each: true })
    @MaxLength(20, { each: true })
    @Transform(trimAndLowerCaseArray)
    @Field(() => [String])
    tags!: string[];
}
