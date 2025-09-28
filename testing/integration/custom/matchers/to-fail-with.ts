import type { MatcherFunction } from 'expect';
import { GraphQLErrorResponse } from '@integration/interfaces/error-response.interface';

export const toFailWith: MatcherFunction<[code: unknown, message: unknown]> =
    function (response: unknown, code: unknown, message: unknown) {
        const typedResponse = response as { body: GraphQLErrorResponse };

        if (!typedResponse.body)
            throw new TypeError('response must be a valid response object');

        const body = typedResponse.body;

        if (typeof body !== 'object' || !body.errors)
            throw new TypeError('body must be a valid response body');

        if (body.errors.length > 1)
            throw new Error('More than one error was found in the body');

        if (body.errors.length === 0)
            throw new Error('No error was found in the body');

        const error = body.errors.at(0)!;

        const pass =
            this.equals(error.code, code) &&
            this.equals(error.message, message);

        if (pass) {
            return {
                pass: true,
                message: () =>
                    `Expected response **not** to match error:\n` +
                    `  code: ${this.utils.printExpected(code)}\n` +
                    `  message: ${this.utils.printExpected(message)}\n` +
                    `But received:\n` +
                    `  code: ${this.utils.printReceived(error.code)}\n` +
                    `  message: ${this.utils.printReceived(error.message)}`,
            };
        } else {
            return {
                pass: false,
                message: () =>
                    `Expected response to match error:\n` +
                    `  code: ${this.utils.printExpected(code)}\n` +
                    `  message: ${this.utils.printExpected(message)}\n` +
                    `But received:\n` +
                    `  code: ${this.utils.printReceived(error.code)}\n` +
                    `  message: ${this.utils.printReceived(error.message)}`,
            };
        }
    };
