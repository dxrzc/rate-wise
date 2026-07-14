import { CodegenConfig } from '@graphql-codegen/cli';

// Reference: https://www.apollographql.com/docs/react/development-testing/graphql-codegen#a-note-about-the-client-preset
const config: CodegenConfig = {
    overwrite: true,
    schema: '../src/common/graphql/schema.gql',
    documents: ['src/**/*.{ts,tsx}'],
    ignoreNoDocuments: true,
    generates: {
        './src/types/__generated__/graphql.ts': {
            plugins: ['typescript-operations'],
            config: {
                nonOptionalTypename: true,
                skipTypeNameForRoot: true,
            },
        },
    },
};

export default config;
