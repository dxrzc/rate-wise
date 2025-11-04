import { calculateTokenTTLSeconds } from 'src/tokens/functions/calculate-token-ttl';

describe('calculateTokenTTLSeconds', () => {
    test('return the number of seconds of the remaining token time to live', () => {
        jest.spyOn(Date, 'now').mockReturnValue(Date.now());
        const tokenTTLInSeconds = 3600;
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const tokenExpiresAtUnixSeconds = nowInSeconds + tokenTTLInSeconds;
        const finalttl = calculateTokenTTLSeconds(tokenExpiresAtUnixSeconds);
        expect(finalttl).toBe(tokenTTLInSeconds);
    });
});
