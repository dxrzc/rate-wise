import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsPositive } from 'class-validator';

@ArgsType()
export class SeedArgs {
    @IsInt()
    @IsPositive()
    @Field(() => Int, {
        description: 'Number of users to create during the seeding process.',
        defaultValue: 10,
        nullable: true,
    })
    users!: number;

    @IsInt()
    @IsPositive()
    @Field(() => Int, {
        description: 'Number of items to create per user during the seeding process.',
        defaultValue: 3,
        nullable: true,
    })
    itemsPerUser!: number;
}
