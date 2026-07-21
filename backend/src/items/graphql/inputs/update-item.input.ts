import { InputType, PartialType } from '@nestjs/graphql';
import { CreateItemInput } from './create-item.input';

@InputType({
    description: 'Input type for updating an existing item. All fields are optional.',
})
export class UpdateItemInput extends PartialType(CreateItemInput) {}
