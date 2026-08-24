const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  console.log('Testing connection to DATABASE_URL:', process.env.DATABASE_URL)
  try {
    await prisma.$connect()
    console.log('✅ SUCCESS: Connected to PostgreSQL!')
    const count = await prisma.facility.count()
    console.log('Facility count:', count)
  } catch (err) {
    console.error('❌ CONNECTION FAILED:')
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

test()
