export const filterItemsDocs = {
    name: 'filterItems',
    description: `Retrieve items based on specified filters such as creator, category, or tag.
    
    **Authentication:** Not required (public endpoint)
        
    **Authorization:** None
        
    **Pagination:** Uses cursor-based pagination for efficient data retrieval. Supports limit (1-100) and cursor parameters.
        
    **Rate Limiting:** Balanced throttle applied
        
    **Returns:** Paginated list of items filtered by the provided arguments, including edges, nodes, total count, and hasNextPage indicator
 `,
};
