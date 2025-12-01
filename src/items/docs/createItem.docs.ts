import { MutationOptions } from '@nestjs/graphql';

export const createItemDocs: MutationOptions = {
    name: 'createItem',
    description: `
        Create a new item to be rated and reviewed by the community.
        
        **Authentication:** Required - user must be authenticated
        
        **Authorization:** All roles allowed (USER, MODERATOR, ADMIN)
        
        **Account Status Required:** ACTIVE - only users with active accounts can create items
        
        **Effect:** Creates a new item with the provided title, description, category, and optional tags. The item is associated with the authenticated user as the creator.
        
        **Rate Limiting:** Balanced throttle applied to prevent spam
        
        **Returns:** The created item with ID, timestamps, title, description, category, tags, initial average rating (0), and creator ID
    `,
};
