import { inject, Injectable } from '@angular/core';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { CacheResetter, GraphqlExecutor } from './graphql-executor.port';
import { APOLLO_CLIENT } from './apollo-client.factory';
import { fail, ok, Result } from '../errors/app-error';
import { ERROR_MAPPER } from '../errors/error-mapper.port';

@Injectable({ providedIn: 'root' })
export class ApolloGraphqlExecutor implements GraphqlExecutor, CacheResetter {
  private readonly client = inject(APOLLO_CLIENT);
  private readonly errorMapper = inject(ERROR_MAPPER, { optional: true });

  async query<TData, TVars>(
    doc: TypedDocumentNode<TData, TVars>,
    vars?: TVars,
    opts?: { fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' },
  ): Promise<Result<TData>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clientAny = this.client as any;
      const res = await clientAny.query({
        query: doc,
        variables: vars,
        fetchPolicy: opts?.fetchPolicy === 'cache-and-network' ? 'network-only' : opts?.fetchPolicy,
      });
      return ok(res.data as TData);
    } catch (err) {
      const error = this.errorMapper ? this.errorMapper.map(err) : (err as Error);
      return fail(error as never);
    }
  }

  async mutate<TData, TVars>(
    doc: TypedDocumentNode<TData, TVars>,
    vars?: TVars,
  ): Promise<Result<TData>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clientAny = this.client as any;
      const res = await clientAny.mutate({
        mutation: doc,
        variables: vars,
      });
      return ok(res.data as TData);
    } catch (err) {
      const error = this.errorMapper ? this.errorMapper.map(err) : (err as Error);
      return fail(error as never);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.client.resetStore();
    } catch {
      await this.client.clearStore();
    }
  }
}
