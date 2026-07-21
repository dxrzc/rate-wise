// Useful app configs for E2E tests
export class AppConfig {
    public readonly maxUserSessions: number;

    constructor() {
        this.maxUserSessions = Number(process.env.MAX_USER_SESSIONS);
    }
}
