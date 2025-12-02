import { MutationOptions } from '@nestjs/graphql';

export const signInDocs: MutationOptions = {
    name: 'signIn',
    description: `
        Authenticate a user with email and password credentials.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Account Status:** Any account status can sign in, but access to other operations may be restricted based on status
        
        **Session:** Upon successful authentication, a new user session is created and a session cookie (connect.sid) is set in the response. This cookie is used for authentication in subsequent requests.
        
        **Session Limits:** Users are subject to a maximum number of concurrent sessions (hard limit). When this limit is reached, new sign-in attempts will be rejected with a "Maximum sessions reached" error. Sessions are NOT automatically evicted - users must explicitly sign out of existing sessions before creating new ones.
        
        **Rate Limiting:** Critical throttle applied to prevent brute force attacks
        
        **Returns:** Account details including user ID, username, email, roles, account status, and reputation score
    `,
};
