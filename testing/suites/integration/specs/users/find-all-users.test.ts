import { sleep } from '@integration/utils/sleep.util';
import { testKit } from '@integration/utils/test-kit.util';
import { IEdgeType } from 'src/pagination/interfaces/edge-type.interface';
import { User } from 'src/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';

describe('Gql - findAllUsers', () => {
    let userRepository: Repository<User>;

    beforeAll(() => {
        userRepository = testKit.app.get(DataSource).getRepository(User);
    });

    afterEach(async () => {
        await userRepository.createQueryBuilder().delete().execute();
    });

    const findAllGqlQuery = `
        query FindAllUsers($limit: Int, $cursor: String) {
                    findAllUsers(limit: $limit, cursor: $cursor) {
                        edges {
                            cursor
                            node {
                                id
                                email
                                createdAt
                            }
                        }
                    }
                }
    `;

    type EdgesType = IEdgeType<User>[];

    describe('All created_at values are identical', () => {
        test('pagination works correctly using id as the tie-breaker.', async () => {
            const entities = Array.from({ length: 7 }, () =>
                userRepository.create(testKit.userSeed.user),
            );
            // every row in that single INSERT statement gets the same timestamp
            await userRepository.insert(entities);
            const expectedOrderedResults = await userRepository
                .createQueryBuilder()
                .orderBy('created_at', 'ASC')
                .addOrderBy(`id`, 'ASC')
                .getMany();
            // page 1
            const page1 = await testKit.gqlClient.send({
                query: findAllGqlQuery,
                variables: {
                    limit: 3,
                    cursor: null,
                },
            });
            expect(page1).notToFail();
            const edges1 = <EdgesType>page1.body.data.findAllUsers.edges;
            // assert page 1 ordering
            expect(edges1).toHaveLength(3);
            expect(edges1.map((e) => e.node.id)).toEqual(
                expectedOrderedResults.slice(0, 3).map((u) => u.id),
            );
            // page 2 (using last cursor of page 1)
            const page2 = await testKit.gqlClient.send({
                query: findAllGqlQuery,
                variables: {
                    limit: 3,
                    cursor: edges1[edges1.length - 1].cursor,
                },
            });
            expect(page2).notToFail();
            const edges2 = <EdgesType>page2.body.data.findAllUsers.edges;
            // assert page 2 ordering
            expect(edges2).toHaveLength(3);
            expect(edges2.map((e) => e.node.id)).toEqual(
                expectedOrderedResults.slice(3, 6).map((u) => u.id),
            );
            // assert no duplicates between pages
            const idsPage1 = edges1.map((e) => e.node.id);
            const idsPage2 = edges2.map((e) => e.node.id);
            idsPage2.forEach((id) => {
                expect(idsPage1).not.toContain(id);
            });
        });
    });

    describe('Pagination exhaustion', () => {
        test('paginates until no more records are available', async () => {
            const entities = Array.from({ length: 10 }, () =>
                userRepository.create(testKit.userSeed.user),
            );
            await userRepository.insert(entities);
            const expectedOrderedResults = await userRepository
                .createQueryBuilder()
                .orderBy('created_at', 'ASC')
                .addOrderBy('id', 'ASC')
                .getMany();
            const collectedIds: string[] = [];
            let cursor: string | null = null;
            const limit = 3;
            // paginate until empty page
            while (true) {
                const response = await testKit.gqlClient.send({
                    query: findAllGqlQuery,
                    variables: { limit, cursor },
                });
                expect(response).notToFail();
                const edges = <EdgesType>response.body.data.findAllUsers.edges;
                if (edges.length === 0) break;
                edges.forEach((e) => collectedIds.push(e.node.id));
                cursor = edges[edges.length - 1].cursor;
            }
            // all records returned exactly once
            expect(collectedIds).toHaveLength(expectedOrderedResults.length);
            expect(collectedIds).toEqual(expectedOrderedResults.map((u) => u.id));
        });
    });

    describe('Pagination with different created_at values', () => {
        test('orders and paginates by created_at correctly', async () => {
            const users = new Array<User>();
            for (let i = 0; i < 5; i++) {
                const user = userRepository.create(testKit.userSeed.user);
                await userRepository.save(user);
                await sleep(100); // different timestamps
                users.push(user);
            }
            const expectedOrderedResults = await userRepository
                .createQueryBuilder()
                .orderBy('created_at', 'ASC')
                .addOrderBy('id', 'ASC')
                .getMany();
            // page 1
            const page1 = await testKit.gqlClient.send({
                query: findAllGqlQuery,
                variables: { limit: 2, cursor: null },
            });
            expect(page1).notToFail();
            const edges1 = <EdgesType>page1.body.data.findAllUsers.edges;
            // assert first page ordering
            expect(edges1.map((e) => e.node.id)).toEqual(
                expectedOrderedResults.slice(0, 2).map((u) => u.id),
            );
            // page 2
            const page2 = await testKit.gqlClient.send({
                query: findAllGqlQuery,
                variables: {
                    limit: 2,
                    cursor: edges1[edges1.length - 1].cursor,
                },
            });
            // assert second page ordering
            expect(page2).notToFail();
            expect((<EdgesType>page2.body.data.findAllUsers.edges).map((e) => e.node.id)).toEqual(
                expectedOrderedResults.slice(2, 4).map((u) => u.id),
            );
        });
    });
});
