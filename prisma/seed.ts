import { prisma } from '../lib/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  // 1. Seed plans
  const plans = [
    {
      name: 'Trial',
      displayName: 'Trial',
      maxStaff: 2,
      maxMonthlySurveyResponses: 50,
      allowTelegramAlert: false,
      allowMultiLanguage: false,
      allowPromotionPhoto: false,
      allowAiTranslation: false,
      allowAiCrisisChatbot: false,
      priceMonthly: 0,
    },
    {
      name: 'Starter',
      displayName: 'Starter',
      maxStaff: 5,
      maxMonthlySurveyResponses: 300,
      allowTelegramAlert: false,
      allowMultiLanguage: false,
      allowPromotionPhoto: true,
      allowAiTranslation: false,
      allowAiCrisisChatbot: false,
      priceMonthly: 19,
    },
    {
      name: 'Basic',
      displayName: 'Basic',
      maxStaff: 15,
      maxMonthlySurveyResponses: 1500,
      allowTelegramAlert: true,
      allowMultiLanguage: true,
      allowPromotionPhoto: true,
      allowAiTranslation: false,
      allowAiCrisisChatbot: false,
      priceMonthly: 49,
    },
    {
      name: 'Premium',
      displayName: 'Premium',
      maxStaff: 999,
      maxMonthlySurveyResponses: 10000,
      allowTelegramAlert: true,
      allowMultiLanguage: true,
      allowPromotionPhoto: true,
      allowAiTranslation: true,
      allowAiCrisisChatbot: true,
      priceMonthly: 149,
    },
  ];

  console.log('Seeding plans...');
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  // 2. Seed PLATFORM_OWNER user
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

  console.log(`Seeding platform owner: ${adminEmail}...`);
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'Platform Administrator',
      passwordHash,
      role: UserRole.PLATFORM_OWNER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    create: {
      fullName: 'Platform Administrator',
      email: adminEmail,
      passwordHash,
      role: UserRole.PLATFORM_OWNER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
