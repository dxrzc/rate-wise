import 'expect';

declare global {
    namespace jest {
        interface Matchers<R> {
            toFailWith(code: string, message: string): R;
        }
    }
}
