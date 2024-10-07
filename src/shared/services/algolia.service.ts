/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import type { SearchClient, SearchResult } from 'algoliasearch';
import { algoliasearch } from 'algoliasearch';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class AlgoliaService {
  private readonly client: SearchClient;

  private readonly productIndex: string;

  constructor(private readonly configService: ApiConfigService) {
    const { appId, apiKey, productIndex } = this.configService.algoliaConfig;
    this.client = algoliasearch(appId, apiKey);
    this.productIndex = productIndex;
  }

  async addProduct(
    product: {
      objectID: string;
      name: string;
      description: string;
      price: number;
      image: string;
    },
    indexName?: string,
  ): Promise<void> {
    const { taskID } = await this.client.saveObject({
      indexName: indexName ?? this.productIndex,
      body: product,
    });

    await this.client.waitForTask({
      indexName: 'products',
      taskID,
    });
  }

  async updateProduct(
    product: {
      objectID: string;
      name?: string;
      description?: string;
      price?: number;
      image?: string;
    },
    indexName?: string,
  ): Promise<void> {
    const { taskID } = await this.client.partialUpdateObject({
      indexName: indexName ?? this.productIndex,
      objectID: product.objectID,
      attributesToUpdate: product,
      createIfNotExists: false,
    });

    if (!taskID) {
      throw new Error('Failed to update product');
    }

    await this.client.waitForTask({
      indexName: indexName ?? this.productIndex,
      taskID,
    });
  }

  async deleteProduct(productId: string, indexName?: string): Promise<void> {
    const { taskID } = await this.client.deleteObject({
      indexName: indexName ?? this.productIndex,
      objectID: productId,
    });

    await this.client.waitForTask({
      indexName: indexName ?? this.productIndex,
      taskID,
    });
  }

  async searchProducts<T>(
    query: string,
    indexName?: string,
  ): Promise<Array<SearchResult<T>>> {
    const { results } = await this.client.search<T>({
      requests: [
        {
          indexName: indexName ?? this.productIndex,
          query,
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return results;
  }
}
