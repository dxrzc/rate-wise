import { registerEnumType } from '@nestjs/graphql';

export enum VoteAction {
    UP = 'up',
    DOWN = 'down',
}

registerEnumType(VoteAction, {
    name: 'VoteAction',
    description: 'Possible actions for voting on a review.',
    valuesMap: {
        UP: {
            description: 'An upvote indicating approval of the review.',
        },
        DOWN: {
            description: 'A downvote indicating disapproval of the review.',
        },
    },
});
