import { Code } from '@integration/enum/code.enum';
import 'expect';

declare global {
    namespace jest {
        interface Matchers<R> {
            toFailWith(code: Code, message: string): R;
            notToFail(): R;
        }
    }
}
