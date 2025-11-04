import 'expect';

declare global {
    namespace jest {
        interface Matchers<R> {
            toContainCookie(cookie: string): R;
            emailSentToThisAddress(): Promise<R>;
        }
    }
}
