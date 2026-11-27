/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Aucun cycle de dépendance autorisé',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'domain-and-application-pure',
      severity: 'error',
      comment:
        'Domain et Application doivent être purs (pas de @angular, @apollo, rxjs, core/graphql, shared, layout)',
      from: {
        path: '^src/app/features/[^/]+/(domain|application)/',
      },
      to: {
        path: '(@angular|@apollo|rxjs|^src/app/core/graphql|^src/app/core/notifications/material|^src/app/shared|^src/app/layout)',
      },
    },
    {
      name: 'presentation-no-infrastructure',
      severity: 'error',
      comment: 'La couche Présentation ne doit pas importer directement l infrastructure',
      from: {
        path: '^src/app/features/([^/]+)/presentation/',
      },
      to: {
        path: '^src/app/features/[^/]+/infrastructure/',
      },
    },
    {
      name: 'no-cross-feature-imports',
      severity: 'error',
      comment: 'Une fonctionnalité ne doit pas importer l intérieur d une autre fonctionnalité',
      from: {
        path: '^src/app/features/([^/]+)/',
      },
      to: {
        path: '^src/app/features/([^/]+)/',
        pathNot: '^src/app/features/$1/',
      },
    },
    {
      name: 'core-no-features-layout-shared',
      severity: 'error',
      comment: 'Core ne doit pas dépendre de features, layout ou shared',
      from: {
        path: '^src/app/core/',
      },
      to: {
        path: '^src/app/(features|layout|shared)/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.app.json',
    },
  },
};
