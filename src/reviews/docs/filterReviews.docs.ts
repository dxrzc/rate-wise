export const filterReviewsDocs = {
    name: 'filterReviews',
    description: `Retrieve reviews based on specified filters such as creator or related item.
    
    **Authentication:** Not required (public endpoint)
        
    **Authorization:** None
        
    **Pagination:** Uses cursor-based pagination for efficient data retrieval. Supports limit (1-100) and cursor parameters.
        
    **Rate Limiting:** Balanced throttle applied
        
    **Returns:** Paginated list of reviews filtered by the provided arguments, including edges, nodes, total count, and hasNextPage indicator
 `,
};
