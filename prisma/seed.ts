// const { PrismaClient } = require('@prisma/client');

// const prisma = new PrismaClient();

// async function main() {
//     try {
//         // Add your seeding logic here
//         // Example:
//         // await prisma.user.create({
//         //   data: {
//         //     email: 'test@example.com',
//         //     name: 'Test User',
//         //   },
//         // });

//         const images = await prisma.productImage.findMany();

//         for (const image of images) {
//             await prisma.productImage.update({
//                 where: { id: image.id },
//                 data: {
//                     url: `https://dapfy-market-files.s3.eu-north-1.amazonaws.com/${image.url}`,
//                 },
//             });
//         }
//     } catch (error) {
//         console.error('Error seeding database:', error);

//         throw error;
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// main();
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// eslint-disable-next-line prettier/prettier, @typescript-eslint/no-unused-vars
const var1 = 1;
