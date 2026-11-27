import { InjectionToken } from '@angular/core';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Result } from '../errors/app-error';

export interface GraphqlExecutor {
  query<TData, TVars>(
    doc: TypedDocumentNode<TData, TVars>,
    vars?: TVars,
    opts?: { fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' },
  ): Promise<Result<TData>>;
  mutate<TData, TVars>(doc: TypedDocumentNode<TData, TVars>, vars?: TVars): Promise<Result<TData>>;
}

export const GRAPHQL_EXECUTOR = new InjectionToken<GraphqlExecutor>('GRAPHQL_EXECUTOR');

export interface CacheResetter {
  reset(): Promise<void>;
}

export const CACHE_RESETTER = new InjectionToken<CacheResetter>('CACHE_RESETTER');
