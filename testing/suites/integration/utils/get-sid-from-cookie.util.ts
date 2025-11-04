export function getSidFromCookie(rawSessionCookie: string): string {
    const undecodedSession = rawSessionCookie.split(';')[0].split('=')[1];
    const decoded = decodeURIComponent(undecodedSession);
    const sid = decoded.slice(2).split('.')[0];
    return sid;
}
