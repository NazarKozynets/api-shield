import 'dotenv/config';
import { createHash, randomBytes } from 'crypto';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// function for hashing api keys
function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

// Function for generating api keys
function generateApiKey(): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const prefix = 'sk_test';
  const publicPart = randomBytes(6).toString('hex');
  const secretPart = randomBytes(32).toString('hex');

  const rawKey = `${prefix}_${publicPart}_${secretPart}`;
  const keyPrefix = `${prefix}_${publicPart}`;
  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: {
      slug: 'demo-tenant',
    },
    update: {},
    create: {
      name: 'Demo Tenant',
      slug: 'demo-tenant',
    },
  });

  const existingKey = await prisma.apiKey.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Demo API Key',
    },
  });

  if (existingKey) {
    console.log('Demo tenant already exists');
    console.log('Tenant ID:', tenant.id);
    console.log('API key already exists. Raw key cannot be shown again.');
    return;
  }

  const apiKey = generateApiKey();

  await prisma.apiKey.create({
    data: {
      tenantId: tenant.id,
      name: 'Demo API Key',
      keyPrefix: apiKey.keyPrefix,
      keyHash: apiKey.keyHash,
    },
  });

  console.log('Seed completed');
  console.log('Tenant ID:', tenant.id);
  console.log('Raw API Key:', apiKey.rawKey);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
