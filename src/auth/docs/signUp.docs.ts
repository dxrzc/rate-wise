import { MutationOptions } from '@nestjs/graphql';

export const signUpDocs: MutationOptions = {
    name: 'signUp',
    description: `
        Register a new user account with email and password credentials.
        
        **Authentication:** Not required (public endpoint)
        
        **Authorization:** None
        
        **Account Status:** Creates a new account with PENDING_VERIFICATION status
        
        **Session:** Upon successful registration, a new user session is created and a session cookie (connect.sid) is set in the response. This cookie is used for authentication in subsequent requests.
        
        **Rate Limiting:** Critical throttle applied to prevent abuse
        
        **Returns:** Account details including user ID, username, email, roles, account status, and reputation score
    `,
};
