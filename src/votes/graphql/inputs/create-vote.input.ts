import { InputType } from '@nestjs/graphql';
import { Field } from '@nestjs/graphql';
import { IsDefined, IsString } from 'class-validator';
import { VoteAction } from '../../enum/vote.enum';

@InputType({
    description: 'Input data required to create a new vote for a review.',
})
export class CreateVoteInput {
    @IsDefined()
    @Field(() => VoteAction, {
        description: 'The action of the vote, either UP or DOWN.',
    })
    readonly vote!: VoteAction;

    @IsDefined()
    @IsString()
    @Field(() => String, {
        description: 'The unique ID of the review being voted on.',
    })
    readonly reviewId!: string;
}
