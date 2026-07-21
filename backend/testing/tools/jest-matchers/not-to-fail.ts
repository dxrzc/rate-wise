import type { MatcherFunction } from 'expect';
import { GraphQLErrorResponse } from '@integration/interfaces/error-response.interface';

// This matcher will pass if there are NO GraphQL errors in the response
export const notToFail: MatcherFunction<[void]> = function (response: unknown) {
    const typedResponse = response as { body: GraphQLErrorResponse };

    const hasError =
        Array.isArray(typedResponse.body.errors) && typedResponse.body.errors.length > 0;

    const pass = !hasError;

    if (pass) {
        return {
            message: () =>
                `Expected response to contain errors, but it did not.\n` +
                `Received:\n${this.utils.printReceived(typedResponse.body)}`,
            pass: true,
        };
    } else {
        const error = typedResponse.body.errors[0];
        return {
            message: () =>
                `Expected response **not** to contain errors, but it did.\n` +
                `Error code: ${this.utils.printReceived(error.code)}\n` +
                `Error message: ${this.utils.printReceived(error.message)}`,
            pass: false,
        };
    }
};
