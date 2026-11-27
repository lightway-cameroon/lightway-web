export const environment = {
  production: false,
  environment: 'dev' as const,
  gatewayUrl: 'http://localhost:3000/graphql',
  healthUrl: 'http://localhost:3000/health',
  phase: 1 as const,
  defaultLanguage: 'fr' as const,
};
