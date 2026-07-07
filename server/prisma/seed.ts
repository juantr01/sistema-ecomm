import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = ["Roupas", "Calçados", "Acessórios", "Eletrônicos", "Casa", "Beleza", "Outros"];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@loja.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const adminName = process.env.ADMIN_NAME ?? "Admin";

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: { name: adminName, email: adminEmail, passwordHash },
    });
    console.log(`Usuário admin criado: ${adminEmail} / senha: ${adminPassword}`);
  } else {
    console.log(`Usuário admin já existe: ${adminEmail}`);
  }

  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Categorias padrão garantidas: ${DEFAULT_CATEGORIES.join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
