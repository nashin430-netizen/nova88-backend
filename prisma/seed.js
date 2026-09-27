import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Demo Admin",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN"
    }
  });

  const games = [
    ["Golden Spin", "slots", "🎰", "Classic reel-style demo"],
    ["Neon Rush", "arcade", "🕹️", "Fast arcade-style concept"],
    ["Royal Cards", "cards", "🃏", "Elegant card-game interface"],
    ["Lucky Gems", "slots", "💎", "Premium gem-themed demo"]
  ];

  for (const [name, category, icon, description] of games) {
    await prisma.game.create({
      data: {
        name,
        category,
        icon,
        description
      }
    });
  }

  await prisma.promotion.create({
    data: {
      title: "Welcome Demo",
      description: "Demo promotional content for the frontend."
    }
  });

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
