import { Code } from '@integration/enum/code.enum';
import 'expect';

// GraphQL ONLY
declare global {
    namespace jest {
        interface Matchers<R> {
            notToFail(): R;
            toFailWith(code: Code, message: string): R;
        }
    }
}
