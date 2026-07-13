import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products: { name: string; cost: number; priceAtual: number; netReceived: number }[] = [
  { name: "Moletom Infantil Homem Aranha", cost: 33, priceAtual: 59.68, netReceived: 43.74 },
  { name: "Moletom Canguru Adulto Palmeiras", cost: 40, priceAtual: 67.69, netReceived: 50.15 },
  { name: "Moletom Canguru Liso (diverso)", cost: 37, priceAtual: 64.06, netReceived: 47.25 },
  { name: "Moletom Canguru Liso Preto", cost: 32, priceAtual: 58.06, netReceived: 42.45 },
  { name: "Camiseta Polo TX", cost: 24, priceAtual: 48.28, netReceived: 34.62 },
  { name: "Moletom Canguru Infantil Neymar", cost: 34, priceAtual: 60.32, netReceived: 44.25 },
  { name: "Moletom Canguru Adulto Corinthians", cost: 38, priceAtual: 65.63, netReceived: 48.5 },
  { name: "Moletom Canguru Infantil Corinthians", cost: 32, priceAtual: 58.06, netReceived: 42.45 },
  { name: "Moletom Canguru Infantil CR7", cost: 33, priceAtual: 59.68, netReceived: 43.74 },
  { name: "Moletom Canguru Adulto Homem Aranha", cost: 37, priceAtual: 64.06, netReceived: 47.25 },
  { name: "Moletom Canguru Adulto FuelTech", cost: 38, priceAtual: 65.63, netReceived: 48.5 },
  { name: "Moletom Canguru Adulto Milano", cost: 38, priceAtual: 65.63, netReceived: 48.5 },
  { name: "Moletom Canguru Adulto AntiSocialClub", cost: 39, priceAtual: 67.19, netReceived: 49.75 },
  { name: "Moletom Canguru Adulto Anjos", cost: 39, priceAtual: 67.19, netReceived: 49.75 },
  { name: "Moletom Canguru Adulto BMW", cost: 37, priceAtual: 64.04, netReceived: 47.25 },
  { name: "Camiseta Adulto BMW", cost: 14, priceAtual: 36, netReceived: 24.8 },
  { name: "Moletom Canguru Adulto Neymar", cost: 39, priceAtual: 67.19, netReceived: 49.75 },
  { name: "Moletom Canguru Adulto Aranha Central", cost: 38, priceAtual: 65.63, netReceived: 48.5 },
  { name: "Moletom Canguru Infantil Aranha Central", cost: 33, priceAtual: 59.68, netReceived: 43.74 },
  { name: "Moletom Canguru Infantil Milano", cost: 33, priceAtual: 59.68, netReceived: 43.74 },
  { name: "Moletom Canguru Infantil TXC", cost: 33, priceAtual: 59.68, netReceived: 43.74 },
  { name: "Camiseta Adulto Neymar", cost: 15, priceAtual: 37.25, netReceived: 25.8 },
  { name: "Moletom Careca Adulto (diversos)", cost: 34, priceAtual: 60.32, netReceived: 44.25 },
  { name: "Moletom Careca Adulto Preto", cost: 28, priceAtual: 53.33, netReceived: 38.67 },
  { name: "Moletom Canguru Adulto TXC", cost: 39, priceAtual: 67.19, netReceived: 49.75 },
  { name: "Moletom Canguru Adulto Blessed", cost: 37, priceAtual: 64.06, netReceived: 47.25 },
  { name: "Moletom Canguru Adulto Osascorte", cost: 38, priceAtual: 65.63, netReceived: 48.5 },
  { name: "Moletom Canguru Liso Azul Marinho", cost: 32, priceAtual: 58.06, netReceived: 42.45 },
  { name: "Moletom Canguru Liso Mescla", cost: 32, priceAtual: 58.06, netReceived: 42.45 },
  { name: "Moletom Careca Adulto Chumbo", cost: 28, priceAtual: 53.33, netReceived: 38.67 },
];

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(new RegExp("[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]", "g"), "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const skuCounts = new Map<string, number>();

  for (const p of products) {
    let sku = slugify(p.name);
    const count = skuCounts.get(sku) ?? 0;
    skuCounts.set(sku, count + 1);
    if (count > 0) sku = `${sku}-${count + 1}`;

    const created = await prisma.product.upsert({
      where: { sku },
      update: {
        costPrice: p.cost,
        salePrice: p.priceAtual,
        netReceivedPrice: p.netReceived,
      },
      create: {
        name: p.name,
        sku,
        costPrice: p.cost,
        salePrice: p.priceAtual,
        netReceivedPrice: p.netReceived,
        sourceType: "DROPSHIPPING",
        stockQuantity: 0,
      },
    });
    console.log(`OK  ${created.sku.padEnd(45)} ${created.name}`);
  }

  const total = await prisma.product.count();
  console.log(`\nImportacao concluida. Total de produtos no banco: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
