import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export abstract class BaseModel {
    @Field(() => ID, {
        description: `
            Unique identifier for the model instance
        `,
    })
    id!: string;

    @Field(() => Date, {
        description: `
            The date and time when the model instance was created
        `,
    })
    createdAt!: Date;

    @Field(() => Date, {
        description: `
            The date and time when the model instance was last updated
        `,
    })
    updatedAt!: Date;
}
