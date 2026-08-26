require('./src/config')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  console.log('Testing PostgreSQL connection...')
  try {
    await prisma.$connect()
    console.log('SUCCESS: Connected to PostgreSQL.')
    const count = await prisma.facility.count()
    console.log('Facility count:', count)
  } catch (err) {
    console.error('CONNECTION FAILED:', err.code || err.name || 'UNKNOWN_ERROR')
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

test()
