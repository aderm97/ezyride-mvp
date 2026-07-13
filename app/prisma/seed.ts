import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Demo accounts for the ride-lifecycle demo. Roles use the app's
// convention (uppercase RIDER / DRIVER), matching the API route guards.
const DEMO_PASSWORD = 'password123';

async function main() {
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);

  const rider = await prisma.user.upsert({
    where: { email: 'traveler@ezyride.demo' },
    update: { password: hashed, name: 'Adaora O.', role: 'RIDER' },
    create: {
      email: 'traveler@ezyride.demo',
      password: hashed,
      name: 'Adaora O.',
      role: 'RIDER',
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'chauffeur@ezyride.demo' },
    update: { password: hashed, name: 'Daniel K.', role: 'DRIVER', isActive: true },
    create: {
      email: 'chauffeur@ezyride.demo',
      password: hashed,
      name: 'Daniel K.',
      role: 'DRIVER',
      isActive: true,
    },
  });

  console.log('Seeded demo users:');
  console.log(`  RIDER   ${rider.email}  / ${DEMO_PASSWORD}`);
  console.log(`  DRIVER  ${driver.email}  / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
