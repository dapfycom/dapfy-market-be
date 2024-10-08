/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import type { SearchClient, SearchResult } from 'algoliasearch';
import { algoliasearch } from 'algoliasearch';
import { ApiConfigService } from './api-config.service';

export interface IProduct {
  objectID: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  slug: string;
  category: string;
}

@Injectable()
export class AlgoliaService {
  private readonly client: SearchClient;

  private readonly productIndex: string;

  constructor(private readonly configService: ApiConfigService) {
    const { appId, apiKey, productIndex } = this.configService.algoliaConfig;
    this.client = algoliasearch(appId, apiKey);
    this.productIndex = productIndex;
  }

  async addProduct(product: IProduct, indexName?: string): Promise<void> {
    const { taskID } = await this.client.saveObject({
      indexName: indexName ?? this.productIndex,
      body: product as any,
    });

    await this.client.waitForTask({
      indexName: 'products',
      taskID,
    });
  }

  async updateProduct(product: IProduct, indexName?: string): Promise<void> {
    const { taskID } = await this.client.partialUpdateObject({
      indexName: indexName ?? this.productIndex,
      objectID: product.objectID,
      attributesToUpdate: product as any,
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

  async searchProducts(
    query: string,
    indexName?: string,
  ): Promise<Array<SearchResult<IProduct>>> {
    const { results } = await this.client.search<IProduct>({
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
