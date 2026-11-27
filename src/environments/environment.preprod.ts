export const environment = {
  production: false,
  environment: 'preprod' as const,
  gatewayUrl: 'https://api-preprod.lightway.cm/graphql',
  healthUrl: 'https://api-preprod.lightway.cm/health',
  phase: 1 as const,
  defaultLanguage: 'fr' as const,
};
