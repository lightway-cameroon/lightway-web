import type { CodegenConfig } from '@graphql-codegen/cli';
import * as fs from 'node:fs';

const schemaPath = './schema/schema.graphql';
const hasSchema = fs.existsSync(schemaPath);

const config: CodegenConfig = {
  overwrite: true,
  schema: hasSchema ? schemaPath : 'type Query { _empty: String }',
  documents: ['src/app/features/**/infrastructure/graphql/**/*.graphql'],
  ignoreNoDocuments: true,
  generates: {
    'src/app/core/graphql/generated/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
};

export default config;
