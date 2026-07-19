import { requestAccountDeletionDocs } from 'src/auth/graphql/docs/requestAccountDeletion.docs';
import { requestAccountVerificationDocs } from 'src/auth/graphql/docs/requestAccountVerification.docs';
import { requestSignOutAllDocs } from 'src/auth/graphql/docs/requestSignOutAll.docs';
import { signInDocs } from 'src/auth/graphql/docs/signIn.docs';
import { signOutDocs } from 'src/auth/graphql/docs/signOut.docs';
import { signOutAllDocs } from 'src/auth/graphql/docs/signOutAll.docs';
import { signUpDocs } from 'src/auth/graphql/docs/signUp.docs';
import { createItemDocs } from 'src/items/graphql/docs/createItem.docs';
import { filterItemsDocs } from 'src/items/graphql/docs/filterItems.docs';
import { findItemByIdDocs } from 'src/items/graphql/docs/findItemById.docs';
import { createReviewDocs } from 'src/reviews/graphql/docs/createReview.docs';
import { filterReviewsDocs } from 'src/reviews/graphql/docs/filterReviews.docs';
import { deleteVoteDocs } from 'src/votes/graphql/docs/deleteVote.docs';
import { findAllReviewVotesDocs } from 'src/votes/graphql/docs/findAllReviewVotes.docs';
import { voteReviewDocs } from 'src/votes/graphql/docs/voteReview.docs';
import { findAllUsersDocs } from 'src/users/graphql/docs/findAllUsers.docs';
import { findUserByIdDocs } from 'src/users/graphql/docs/findUserById.docs';
import { reactivateAccountDocs } from 'src/moderation/graphql/docs/reactivateAccount.docs';
import { suspendAccountDocs } from 'src/moderation/graphql/docs/suspendAccount.docs';

export const featureContexts = [
    // Auth
    {
        name: 'sign-up',
        keywords: ['sign up', 'register', 'create account', 'new account', 'join'],
        context: signUpDocs,
    },
    {
        name: 'sign-in',
        keywords: ['sign in', 'login', 'log in', 'authenticate', 'credentials'],
        context: signInDocs,
    },
    {
        name: 'sign-out',
        keywords: ['sign out', 'logout', 'log out', 'current session', 'exit'],
        context: signOutDocs,
    },
    {
        name: 'sign-out-all',
        keywords: [
            'sign out all',
            'all devices',
            'all sessions',
            'terminate all sessions',
            'logout all',
        ],
        context: signOutAllDocs,
    },
    {
        name: 'request-sign-out-all',
        keywords: [
            'remote sign out',
            'sign out without login',
            'forgot session',
            'lost access',
            'unauthenticated sign out',
        ],
        context: requestSignOutAllDocs,
    },
    {
        name: 'verification',
        keywords: ['verify', 'verification', 'email', 'activate', 'pending', 'confirmation link'],
        context: requestAccountVerificationDocs,
    },
    {
        name: 'deletion',
        keywords: [
            'delete account',
            'remove account',
            'terminate account',
            'cancel account',
            'close account',
        ],
        context: requestAccountDeletionDocs,
    },
    // Items
    {
        name: 'create-item',
        keywords: [
            'create item',
            'new item',
            'add item',
            'publish item',
            'add product',
            'add business',
            'listing',
        ],
        context: createItemDocs,
    },
    {
        name: 'filter-items',
        keywords: [
            'filter items',
            'search items',
            'browse items',
            'find items',
            'list items',
            'category',
            'tag',
            'items by creator',
        ],
        context: filterItemsDocs,
    },
    {
        name: 'find-item',
        keywords: ['find item', 'get item', 'item by id', 'item details', 'look up item'],
        context: findItemByIdDocs,
    },
    // Reviews
    {
        name: 'create-review',
        keywords: [
            'create review',
            'write review',
            'add review',
            'rate item',
            'submit review',
            'rating',
        ],
        context: createReviewDocs,
    },
    {
        name: 'filter-reviews',
        keywords: [
            'filter reviews',
            'search reviews',
            'list reviews',
            'browse reviews',
            'find reviews',
        ],
        context: filterReviewsDocs,
    },
    // Votes
    {
        name: 'vote-review',
        keywords: ['vote', 'upvote', 'downvote', 'like review', 'dislike review', 'cast vote'],
        context: voteReviewDocs,
    },
    {
        name: 'delete-vote',
        keywords: ['delete vote', 'remove vote', 'unvote', 'undo vote', 'retract vote'],
        context: deleteVoteDocs,
    },
    {
        name: 'find-votes',
        keywords: ['find votes', 'list votes', 'votes for review', 'review votes', 'all votes'],
        context: findAllReviewVotesDocs,
    },
    // Users
    {
        name: 'find-user',
        keywords: [
            'find user',
            'get user',
            'user profile',
            'user by id',
            'user details',
            'look up user',
        ],
        context: findUserByIdDocs,
    },
    {
        name: 'find-all-users',
        keywords: [
            'find all users',
            'list users',
            'browse users',
            'all users',
            'users list',
            'paginated users',
        ],
        context: findAllUsersDocs,
    },
    // Moderation
    {
        name: 'suspend-account',
        keywords: [
            'suspend',
            'ban',
            'restrict user',
            'block user',
            'suspend account',
            'moderation',
        ],
        context: suspendAccountDocs,
    },
    {
        name: 'reactivate-account',
        keywords: [
            'reactivate',
            'unsuspend',
            'restore account',
            'unban',
            'lift suspension',
            'reinstate',
        ],
        context: reactivateAccountDocs,
    },
];
