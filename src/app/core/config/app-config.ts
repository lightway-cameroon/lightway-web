export interface AppConfig {
  readonly gatewayUrl: string; // ex. https://api.lightway.cm/graphql
  readonly healthUrl: string; // ex. https://api.lightway.cm/health
  readonly defaultLanguage: 'fr' | 'en';
  readonly phase: 1 | 2 | 3;
  readonly environment: 'dev' | 'preprod' | 'production';
}

export const buildAppConfig = (env: {
  gatewayUrl: string;
  healthUrl: string;
  defaultLanguage: 'fr' | 'en';
  phase: 1 | 2 | 3;
  environment: 'dev' | 'preprod' | 'production';
}): AppConfig => ({
  gatewayUrl: env.gatewayUrl,
  healthUrl: env.healthUrl,
  defaultLanguage: env.defaultLanguage,
  phase: env.phase,
  environment: env.environment,
});
