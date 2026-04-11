// Seed: creates one Customer and one Chatbot so the app works immediately
// Run with: npx prisma db seed

import { PrismaClient } from "../app/generated/prisma/client"

const prisma = new PrismaClient()

async function main() {
  const apiKey = process.env.YOURCHAT_API_KEY
  if (!apiKey) throw new Error("YOURCHAT_API_KEY env var is required for seeding")

  const customer = await prisma.customer.upsert({
    where: { apiKey },
    update: {},
    create: { apiKey },
  })

  const chatbot = await prisma.chatbot.upsert({
    where: { id: "seed-chatbot-001" },
    update: {},
    create: {
      id: "seed-chatbot-001",
      name: "Support Bot",
      customerId: customer.id,
    },
  })

  console.log("Seeded:")
  console.log(`  Customer id: ${customer.id}`)
  console.log(`  Chatbot  id: ${chatbot.id}  name: ${chatbot.name}`)
  console.log("")
  console.log("Add to widget consumer app env (customer-app/.env.local):")
  console.log(`  CHATBOT_ID=${chatbot.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
