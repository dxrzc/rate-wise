export const runSeedDocs = {
    name: 'runSeed',
    description: `
Populates the database with sample data for development and testing purposes.

- **Behavior:**
  - Database is cleared of existing data before seeding.
  - Creates sample users with various roles and account statuses.
  - Creates sample items with different categories and tags.
  - Generates reviews: each user reviews every item except their own.
  - Generates votes: each user upvotes every review (including their own reviews).
  - During the process the admin user is not deleted or modified at all (no items or reviews are created for the admin).

- **Returns:** Boolean \`true\` indicating the seeding process completed successfully.

- **Constraints:**
  - Can only be executed in non-production environments (development/testing).

- **Authentication:** Required.

- **Roles Required:** None.

- **Account Status Required:** \`ACTIVE\`.

    `,
};
