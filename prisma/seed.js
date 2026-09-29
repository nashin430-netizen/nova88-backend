import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create Admin user only if it does not already exist
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.user.upsert({
    where: {
      email: "admin@example.com"
    },
    update: {
      role: "ADMIN"
    },
    create: {
      name: "Demo Admin",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN"
    }
  });

  console.log("Admin user ready.");

  // Create demo games only if they don't already exist
  const games = [
    ["Golden Spin", "slots", "🎰", "Classic reel-style demo"],
    ["Neon Rush", "arcade", "🕹️", "Fast arcade-style concept"],
    ["Royal Cards", "cards", "🃏", "Elegant card-game interface"],
    ["Lucky Gems", "slots", "💎", "Premium gem-themed demo"]
  ];

  for (const [name, category, icon, description] of games) {
    const existingGame = await prisma.game.findFirst({
      where: { name }
    });

    if (!existingGame) {
      await prisma.game.create({
        data: {
          name,
          category,
          icon,
          description
        }
      });
    }
  }

  const existingPromotion = await prisma.promotion.findFirst({
    where: {
      title: "Welcome Demo"
    }
  });

  if (!existingPromotion) {
    await prisma.promotion.create({
      data: {
        title: "Welcome Demo",
        description: "Demo promotional content for the frontend."
      }
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
