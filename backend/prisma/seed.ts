import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/db';
import { env } from '../src/config/env';

async function seed() {
  console.log('[SEED] Checking initial administrator account...');

  const adminEmail = (env.ADMIN_EMAIL || 'albrachars@admin.com').trim().toLowerCase();
  const initialPassword = env.ADMIN_INITIAL_PASSWORD || 'AdminSecure@2026!';

  // Check if administrator already exists to avoid resetting credentials on restart
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { role: 'ADMIN' },
      ],
    },
  });

  if (existingAdmin) {
    console.log(`[SEED] Administrator already exists (${existingAdmin.email}, role: ${existingAdmin.role}). Preserving existing credentials.`);
  } else {
    console.log(`[SEED] Seeding initial administrator account: ${adminEmail}`);

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(initialPassword, saltRounds);

    const adminUser = await prisma.user.create({
      data: {
        fullName: 'System Administrator',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        mustChangePassword: true, // Required to change password on first login
      },
    });

    // Create Audit Log record
    await prisma.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        action: 'ADMIN_SEEDED',
        targetUserId: adminUser.id,
        metadata: {
          email: adminEmail,
          role: 'ADMIN',
          mustChangePassword: true,
        },
        ipAddress: '127.0.0.1',
      },
    });

    console.log(`[SEED] Initial administrator created successfully with ID: ${adminUser.id}`);
  }

  console.log('[SEED] Database seeding complete.');
}

seed()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
