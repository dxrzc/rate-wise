import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDefined, IsInt, IsPositive } from 'class-validator';

@InputType({
    description: 'Input data required for seeding the database.',
})
export class SeedInput {
    @IsDefined()
    @IsInt()
    @IsPositive()
    @Field(() => Int, {
        description: 'Number of users to create during the seeding process.',
    })
    users!: number;

    @IsDefined()
    @IsInt()
    @IsPositive()
    @Field(() => Int, {
        description: 'Number of items to create per user during the seeding process.',
    })
    itemsPerUser!: number;
}
