import { PrismaClient } from '@prisma/client';
import { algoliasearch } from 'algoliasearch';
import { config } from 'dotenv';
import type { IProduct } from '../shared/services/algolia.service';
import { formatPrice } from '../shared/utils/price.utils';

// Load environment variables
config();

const prisma = new PrismaClient();
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_API_KEY!,
);

async function syncProductsToAlgolia(): Promise<void> {
  try {
    // Fetch all products from the database
    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: true,
      },
      where: {
        isActive: true,
        status: 'PUBLISHED',
      },
    });

    // Prepare the products for Algolia
    const algoliaProducts: IProduct[] = products.map((product) => {
      const p: IProduct = {
        objectID: product.id,
        title: product.title,
        description: product.description,
        price: Number.parseFloat(formatPrice(product.price)),
        category: product.category.name,
        images: product.images.map((image) => image.url),
        slug: product.slug,
      };

      return p;
    });

    // Send the products to Algolia
    const res = await algoliaClient.saveObjects({
      indexName: process.env.ALGOLIA_PRODUCT_INDEX!,
      objects: algoliaProducts,
    });

    console.info(`Successfully synced ${res.length} products to Algolia.`);
  } catch (error) {
    console.error('Error syncing products to Algolia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  try {
    await syncProductsToAlgolia();
    console.info('Sync process completed.');
  } catch (error) {
    console.error('Error in sync process:', error);
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error) => {
  console.error('Unhandled error:', error);

  throw error;
});
