import { makeUserSessionRelationKey } from 'src/auth/functions/make-user-session-relation-key';
import { makeSessionsIndexKey } from 'src/auth/functions/make-sessions-index-key';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { createUser } from '@integration/utils/create-user.util';
import { testKit } from '@integration/utils/test-kit.util';
import { sleep } from '@integration/utils/sleep.util';

describe('Session cleanup (redis)', () => {
    describe('Session is deleted from redis store', () => {
        test('session id is deleted from user-sessions-index', async () => {
            // generate a session successfully
            const { sessionCookie, id } = await createUser();
            const sid = getSidFromCookie(sessionCookie);
            const indexKey = makeSessionsIndexKey(id);
            // sid in index
            const indexPrev = await testKit.redisService.setMembers(indexKey);
            expect(indexPrev.length).toBe(1);
            // delete session from redis
            await testKit.redisService.delete(`session:${sid}`);
            // since the redis subscriber works asynchronously
            await sleep(1000);
            // sessions should not exists in sessions-index
            const index = await testKit.redisService.setMembers(indexKey);
            expect(index.length).toBe(0);
        });

        test('session-user relation is deleted', async () => {
            // generate a session successfully
            const { sessionCookie } = await createUser();
            const sid = getSidFromCookie(sessionCookie);
            const key = makeUserSessionRelationKey(sid);
            // sess_user record exists
            const relationPrev = await testKit.redisService.get(key);
            expect(relationPrev).not.toBeNull();
            // delete session from redis
            await testKit.redisService.delete(`session:${sid}`);
            // since the redis subscriber works asynchronously
            await sleep(1000);
            // sess_user should not exists
            const relation = await testKit.redisService.get(key);
            expect(relation).toBeNull();
        });
    });
});
