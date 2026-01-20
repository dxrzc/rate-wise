import { testKit } from '@integration/utils/test-kit.util';
import { GRAPHQL_CONSTANTS } from 'src/common/graphql/constants/graphql.constants';

describe('Gql query depth', () => {
    test('rejects queries exceeding max depth', async () => {
        const res = await testKit.gqlClient.send({
            query: `
        query {
          findUserById(user_id: "1") {
            items {
              nodes {
                reviews {
                  nodes {
                    votes {
                      nodes {
                        user {
                          items {
                            nodes {
                              reviews {
                                nodes {
                                  votes {
                                    nodes {
                                      vote
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
        });
        /* It will return more than error due to the artificial levels applied
        the first error should be about the depth and the other one should be "Cannot query field \"user\" on type \"VoteModel\"
        */
        const errorMessage = res.body.errors[0].message;
        expect(errorMessage).toContain('depth');
        expect(errorMessage).toContain(String(GRAPHQL_CONSTANTS.depthLimit));
    });
});
