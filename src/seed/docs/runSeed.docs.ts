export const runSeedDocs = {
    name: 'runSeed',
    description: `
Populates the database with lightweight sample data for development.
- **Returns:** Boolean \`true\` indicating the seeding process completed successfully.

- **Constraints:**
  - Can only be executed in non-production environments (development/testing).

- **Side Effects:**
  - Database is cleared of existing data before seeding (all non-admin users and related data).
  - Creates a fixed number of sample users with randomized roles and account statuses.
  - Creates a fixed number of items per user.
  - Generates reviews:
    - Each item receives a limited number of randomly selected reviews.
    - Users do not review their own items.
  - Generates votes:
    - Each review receives a limited number of randomly selected votes.
    - Vote direction (up/down) is randomized.
  - The admin user is never deleted or modified.
  - No items, reviews, or votes are created for the admin user.

- **Authentication:** Required.

- **Roles Required:** None.

- **Account Status Required:** \`ACTIVE\`.

    `,
};
