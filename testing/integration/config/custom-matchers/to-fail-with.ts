import type { MatcherFunction } from 'expect';
import { GraphQLErrorResponse } from '@integration/interfaces/error-response.interface';

export const toFailWith: MatcherFunction<[code: string, message: string]> =
    function (response: unknown, code: string, message: string) {
        const typedResponse = response as { body: GraphQLErrorResponse };

        if (!typedResponse.body)
            throw new TypeError('response must be a valid response object');

        const body = typedResponse.body;

        if (typeof body !== 'object' || !body.errors)
            throw new TypeError('body must be a valid response body');

        if (typeof code !== 'string' || typeof message !== 'string')
            throw new TypeError('code and message must be of type string');

        if (body.errors.length > 1)
            throw new Error('More than one error was found in the body');

        if (body.errors.length === 0)
            throw new Error('No error was found in the body');

        const error = body.errors.at(0)!;
        const pass = error.code === code && error.message === message;

        if (pass) {
            return {
                message: () =>
                    `Expected response **not** to match error:\n` +
                    `  code: ${this.utils.printExpected(code)}\n` +
                    `  message: ${this.utils.printExpected(message)}\n` +
                    `But received:\n` +
                    `  code: ${this.utils.printReceived(error.code)}\n` +
                    `  message: ${this.utils.printReceived(error.message)}`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `Expected response to match error:\n` +
                    `  code: ${this.utils.printExpected(code)}\n` +
                    `  message: ${this.utils.printExpected(message)}\n` +
                    `But received:\n` +
                    `  code: ${this.utils.printReceived(error.code)}\n` +
                    `  message: ${this.utils.printReceived(error.message)}`,
                pass: false,
            };
        }
    };
