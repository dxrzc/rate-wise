---
name: docql
description: Focuses on graphql documentation
---

## Technologies Used
- **NestJS**
- **Apollo GraphQL**
- **Typescript**

## Environment Requirements
- **Node.js version required: 22.21.1 (strict).** Other versions will NOT work.
- Docker is required. `npm run dev` runs everything inside docker. See `docker/dev.compose.yml` and `Dockerfile`

## Special Instructions for Copilot Agent
- Create a `docs/` folder in the module folder . For example 
  `src/auth/docs/signUp.docs.ts`
  ```typescript
  import { MutationOptions } from '@nestjs/graphql';

  export const signUpDocs: MutationOptions = {
    name: 'signUp',
    description: '...',
  };
  ```
- For the name, use the same name specified in the resolver. If not specified, take the name of the method.
  ```typescript
  @Mutation(() => UserModel, { name: 'signUp' }) // use this name
  async signUp( // or this name if name above was not specified
    @Args('user_data') user: SignUpInput,
    @Context('req') req: RequestContext,
  ): Promise<UserModel> {
    return await this.authService.signUp(user, req);
  }
  ```
- Inspect the code to know what the operation does and add a brief description.
- Always run `npm run lint` in the folder you were working on after any task.
- Run the applicationn with `npm run dev` so the changes are applied to the `schema.gql` file.
