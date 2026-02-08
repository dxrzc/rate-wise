import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { createItem } from '@integration/utils/create-item.util';
import { createReview } from '@integration/utils/create-review.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { success } from '@integration/utils/no-errors.util';
import { status2xx } from '@integration/utils/status-2xx.util';
import { testKit } from '@integration/utils/test-kit.util';
import { HttpStatus } from '@nestjs/common';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { findUserById } from '@testing/tools/gql-operations/users/find-by-id.operation';
import { voteReview } from '@testing/tools/gql-operations/votes/vote.operation';
import { disableSystemErrorLoggingForThisTest } from '@testing/tools/utils/disable-system-error-logging.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { RATE_LIMIT_PROFILES } from 'src/common/rate-limit/rate-limit.profiles';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { SESS_REDIS_PREFIX } from 'src/sessions/di/sessions.providers';
import { createUserSessionsSetKey } from 'src/sessions/keys/create-sessions-index-key';
import { createSessionAndUserMappingKey } from 'src/sessions/keys/create-session-and-user-mapping-key';
import { createUserCacheKey } from 'src/users/cache/create-cache-key';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { VoteAction } from 'src/votes/enum/vote.enum';
import { createSessionKey } from 'src/sessions/keys/create-session-key';
import { createBlacklistTokenKey } from 'src/tokens/keys/create-blacklist-token-key';

const deleteAccUrl = testKit.endpointsREST.deleteAccount;

describe('GET delete account endpoint with token', () => {
    describe.each(Object.values(AccountStatus))('User account status is %s', (status) => {
        test('user can perform this action', async () => {
            const { id } = await createAccount({ status });
            const token = await testKit.accDeletionToken.generate({ id });
            await expect(testKit.userRepos.findOneBy({ id })).resolves.not.toBeNull();
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
        });
    });

    describe('User not found', () => {
        test('return not found status code and not found error message', async () => {
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            await testKit.userRepos.delete(id); // user deleted
            const res = await testKit.restClient.get(`${deleteAccUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: USER_MESSAGES.NOT_FOUND });
            expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe.each(Object.values(UserRole))('User roles are: [%s]', (role: UserRole) => {
        test('user can perform this action', async () => {
            const { id } = await createAccount({
                roles: [role],
            });
            const token = await testKit.accDeletionToken.generate({ id });
            await expect(testKit.userRepos.findOneBy({ id })).resolves.not.toBeNull();
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
        });
    });

    describe('Success', () => {
        test('account is deleted from database', async () => {
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            await expect(testKit.userRepos.findOneBy({ id })).resolves.not.toBeNull();
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            const userInDb = await testKit.userRepos.findOneBy({ id });
            expect(userInDb).toBeNull();
        });

        test('token is blacklisted', async () => {
            const { id } = await createAccount();
            const { token, jti } = await testKit.accDeletionToken.generate(
                { id },
                { metadata: true },
            );
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            const redisKey = createBlacklistTokenKey(jti);
            const tokenInRedis = await testKit.tokensRedisClient.get(redisKey);
            expect(tokenInRedis).not.toBeNull();
        });

        test('delete user-sessions redis set', async () => {
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            // set exists
            const redisKey = createUserSessionsSetKey(id);
            await expect(testKit.sessionsRedisClient.exists(redisKey)).resolves.toBeTruthy();
            // delete user
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // set does not exist anymore
            await expect(testKit.sessionsRedisClient.exists(redisKey)).resolves.toBeFalsy();
        });

        test('delete all user sessions from redis', async () => {
            // get session-cookie 1
            const { sessionCookie: sess1Cookie, password, email, id } = await createAccount();
            // get session-cookie 2
            const signInRes = await testKit.gqlClient // sess2
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sid1RedisKey = `${SESS_REDIS_PREFIX}${getSidFromCookie(sess1Cookie)}`;
            const sid2RedisKey = `${SESS_REDIS_PREFIX}${getSidFromCookie(getSessionCookie(signInRes))}`;
            // sessions exist in redis
            await expect(testKit.sessionsRedisClient.get(sid1RedisKey)).resolves.not.toBeNull();
            await expect(testKit.sessionsRedisClient.get(sid2RedisKey)).resolves.not.toBeNull();
            // delete user
            const token = await testKit.accDeletionToken.generate({ id });
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // sessions do not exist anymore
            await expect(testKit.sessionsRedisClient.get(sid1RedisKey)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(sid2RedisKey)).resolves.toBeNull();
        });

        test('delete all user-session relation records from redis', async () => {
            const { sessionCookie: sess1Cookie, password, email, id } = await createAccount();
            // get session-cookie 2
            const signInRes = await testKit.gqlClient // sess2
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sess1ID = getSidFromCookie(sess1Cookie);
            const sess2ID = getSidFromCookie(getSessionCookie(signInRes));
            const relation1Key = createSessionAndUserMappingKey(sess1ID);
            const relation2Key = createSessionAndUserMappingKey(sess2ID);
            // relations exist in redis
            await expect(testKit.sessionsRedisClient.get(relation1Key)).resolves.not.toBeNull();
            await expect(testKit.sessionsRedisClient.get(relation2Key)).resolves.not.toBeNull();
            // delete user
            const token = await testKit.accDeletionToken.generate({ id });
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // relations do not exist anymore
            await expect(testKit.sessionsRedisClient.get(relation1Key)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(relation2Key)).resolves.toBeNull();
        });

        test('user is deleted from redis cache', async () => {
            const { id } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            await testKit.gqlClient
                .send(findUserById({ fields: ['id'], args: id }))
                .expect(success); // triggers caching
            await expect(testKit.cacheManager.get(cacheKey)).resolves.toBeDefined();
            const token = await testKit.accDeletionToken.generate({ id }); // delete
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            const userInCache = await testKit.cacheManager.get(cacheKey);
            expect(userInCache).toBeUndefined();
        });

        test('all the items belonging to user are deleted from database', async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            const items = await Promise.all([createItem(id), createItem(id), createItem(id)]);
            const itemsIds = items.map((item) => item.id);
            // verify items exist in db
            for (const itemId of itemsIds)
                await expect(testKit.itemRepos.findOneBy({ id: itemId })).resolves.not.toBeNull();
            // delete account
            const token = await testKit.accDeletionToken.generate({ id });
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // verify items deleted from db
            for (const itemId of itemsIds)
                await expect(testKit.itemRepos.findOneBy({ id: itemId })).resolves.toBeNull();
        });

        test('all reviews belonging to user are deleted from database', async () => {
            const { id: userID } = await createAccount({ status: AccountStatus.ACTIVE });
            const otherAccount = await createAccount({ status: AccountStatus.ACTIVE });
            // items from another user (one review per item due to the new constraint)
            const items = await Promise.all([
                createItem(otherAccount.id),
                createItem(otherAccount.id),
            ]);
            const [item1ID, item2ID] = items.map((item) => item.id);
            // user creates reviews on different items
            const reviews = await Promise.all([
                createReview(item1ID, userID),
                createReview(item2ID, userID),
            ]);
            const reviewsIds = reviews.map((review) => review.id);
            // verify reviews exist in db
            for (const reviewId of reviewsIds) {
                await expect(
                    testKit.reviewRepos.findOneBy({ id: reviewId }),
                ).resolves.not.toBeNull();
            }
            // delete account
            const token = await testKit.accDeletionToken.generate({ id: userID });
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // verify reviews deleted from db
            for (const reviewId of reviewsIds) {
                await expect(testKit.reviewRepos.findOneBy({ id: reviewId })).resolves.toBeNull();
            }
        });

        test('all votes belonging to user are deleted from database', async () => {
            const { id: userID, sessionCookie } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            // item and reviews from another user
            const { id: itemID } = await createItem(
                (await createAccount({ status: AccountStatus.ACTIVE })).id,
            );
            const { id: review1ID } = await createReview(itemID);
            const { id: review2ID } = await createReview(itemID);
            // user votes on reviews
            await testKit.gqlClient
                .send(
                    voteReview({
                        args: { reviewId: review1ID, vote: VoteAction.UP.toUpperCase() },
                    }),
                )
                .set('Cookie', sessionCookie)
                .expect(success);
            await testKit.gqlClient
                .send(
                    voteReview({
                        args: { reviewId: review2ID, vote: VoteAction.DOWN.toUpperCase() },
                    }),
                )
                .set('Cookie', sessionCookie)
                .expect(success);
            // verify votes exist in db
            const votesBeforeDeletion = await testKit.votesRepos.find({
                where: { user: { id: userID } },
            });
            expect(votesBeforeDeletion).toHaveLength(2);
            // delete account
            const token = await testKit.accDeletionToken.generate({ id: userID });
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // verify votes deleted from db
            const votesAfterDeletion = await testKit.votesRepos.find({
                where: { user: { id: userID } },
            });
            expect(votesAfterDeletion).toHaveLength(0);
        });

        test('decrement the votes made by the user in all voted reviews (up or down)', async () => {
            const { id: upvotedReviewId } = await createReview();
            const { id: downvotedReviewId } = await createReview();
            const { sessionCookie, id: userId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            // vote reviews
            await testKit.gqlClient
                .send(
                    voteReview({
                        args: { reviewId: upvotedReviewId, vote: VoteAction.UP.toUpperCase() },
                    }),
                )
                .set('Cookie', sessionCookie)
                .expect(success);
            await testKit.gqlClient
                .send(
                    voteReview({
                        args: { reviewId: downvotedReviewId, vote: VoteAction.DOWN.toUpperCase() },
                    }),
                )
                .set('Cookie', sessionCookie)
                .expect(success);
            // verify votes counted in each review
            const upvotedReviewBeforeDeletion = await testKit.reviewRepos.findOneBy({
                id: upvotedReviewId,
            });
            const downvotedReviewBeforeDeletion = await testKit.reviewRepos.findOneBy({
                id: downvotedReviewId,
            });
            expect(upvotedReviewBeforeDeletion).not.toBeNull();
            expect(downvotedReviewBeforeDeletion).not.toBeNull();
            expect(upvotedReviewBeforeDeletion!.upVotes).toBe(1);
            expect(upvotedReviewBeforeDeletion!.downVotes).toBe(0);
            expect(downvotedReviewBeforeDeletion!.downVotes).toBe(1);
            expect(downvotedReviewBeforeDeletion!.upVotes).toBe(0);
            // delete account
            const token = await testKit.accDeletionToken.generate({ id: userId });
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // fetch reviews and verify counts reset
            const upvotedReviewAfterDeletion = await testKit.reviewRepos.findOneBy({
                id: upvotedReviewId,
            });
            const downvotedReviewAfterDeletion = await testKit.reviewRepos.findOneBy({
                id: downvotedReviewId,
            });
            expect(upvotedReviewAfterDeletion).not.toBeNull();
            expect(downvotedReviewAfterDeletion).not.toBeNull();
            expect(upvotedReviewAfterDeletion!.upVotes).toBe(0);
            expect(upvotedReviewAfterDeletion!.downVotes).toBe(0);
            expect(downvotedReviewAfterDeletion!.upVotes).toBe(0);
            expect(downvotedReviewAfterDeletion!.downVotes).toBe(0);
        });
    });

    describe('Account does not exist', () => {
        test('return not found code and not found error message', async () => {
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            await testKit.userRepos.delete(id); // user deleted
            const res = await testKit.restClient.get(`${deleteAccUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: USER_MESSAGES.NOT_FOUND });
            expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('No token provided', () => {
        test('return bad request status code and invalid url error message', async () => {
            const res = await testKit.restClient.get(deleteAccUrl);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_URL });
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Invalid token', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const invalidToken = faker.string.uuid();
            const res = await testKit.restClient.get(`${deleteAccUrl}?token=${invalidToken}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Token used twice', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            // first use
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // second use
            const res = await testKit.restClient.get(`${deleteAccUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Token for account verification sent', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const { id } = await createAccount();
            // verification token
            const accVerifToken = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${deleteAccUrl}?token=${accVerifToken}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests status code and too many requests error message', async () => {
            const invalidToken = faker.string.uuid();
            const sameIp = faker.internet.ip();
            const requests = Array.from({ length: RATE_LIMIT_PROFILES.ULTRA_CRITICAL.limit }, () =>
                testKit.restClient
                    .get(`${deleteAccUrl}?token=${invalidToken}`)
                    .set('X-Forwarded-For', sameIp),
            );
            await Promise.all(requests);
            const res = await testKit.restClient.get(deleteAccUrl).set('X-Forwarded-For', sameIp);
            expect(res.body).toStrictEqual({ error: COMMON_MESSAGES.TOO_MANY_REQUESTS });
            expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        });
    });

    describe('Token blacklisting fails', () => {
        test('unsuccessful request and user is not deleted', async () => {
            disableSystemErrorLoggingForThisTest();
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            // mock to throw an error
            const redisMock = jest
                .spyOn(RedisClientAdapter.prototype, 'store')
                .mockRejectedValueOnce(new Error());
            // deletion attempt
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(500);
            expect(redisMock).toHaveBeenCalledTimes(1);
            // user still exists
            const userInDb = await testKit.userRepos.findOneBy({ id });
            expect(userInDb).not.toBeNull();
        });

        test('unsuccessful request and sessions are not deleted', async () => {
            disableSystemErrorLoggingForThisTest();
            const { id, sessionCookie } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            // mock to throw an error
            const redisMock = jest
                .spyOn(RedisClientAdapter.prototype, 'store')
                .mockRejectedValueOnce(new Error());
            // deletion attempt
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(500);
            expect(redisMock).toHaveBeenCalledTimes(1);
            // sessions still exist
            const sid = getSidFromCookie(sessionCookie);
            const indexKey = createUserSessionsSetKey(id);
            const relationKey = createSessionAndUserMappingKey(sid);
            const sessKey = createSessionKey(sid);
            const inIndex = await testKit.sessionsRedisClient.setIsMember(indexKey, sid);
            const relation = await testKit.sessionsRedisClient.get(relationKey);
            const session = await testKit.sessionsRedisClient.get(sessKey);
            expect(inIndex).toBeTruthy();
            expect(relation).not.toBeNull();
            expect(session).not.toBeNull();
        });
    });

    describe('Sessions deletion fails', () => {
        test('request succcess', async () => {
            disableSystemErrorLoggingForThisTest();
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            // mock to throw an error
            const redisMock = jest
                .spyOn(RedisClientAdapter.prototype, 'delete')
                .mockRejectedValueOnce(new Error());
            // deletion attempt
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            expect(redisMock).toHaveBeenCalled();
        });
    });
});
