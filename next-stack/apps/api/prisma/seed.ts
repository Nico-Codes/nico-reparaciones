import { PrismaClient, Prisma } from '@prisma/client';
import { loadCanonicalEnv } from '../src/load-canonical-env.js';

loadCanonicalEnv();

const prisma = new PrismaClient();

function env(name: string) {
  return (process.env[name] ?? '').trim();
}

function isTruthy(value: string) {
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function assertSeedAllowed() {
  const nodeEnv = env('NODE_ENV').toLowerCase();
  const allowDemoSeed = isTruthy(env('ALLOW_DEMO_SEED'));
  if (nodeEnv === 'production' && !allowDemoSeed) {
    throw new Error(
      'Seed demo bloqueado en producción. Si es intencional, seteá ALLOW_DEMO_SEED=1 temporalmente.',
    );
  }
}

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedCategoriesAndProducts() {
  const categories = [
    { name: 'Accesorios', slug: 'accesorios', parentSlug: null as string | null },
    { name: 'Cables', slug: 'cables', parentSlug: 'accesorios' },
    { name: 'Cargadores', slug: 'cargadores', parentSlug: 'accesorios' },
    { name: 'Parlantes', slug: 'parlantes', parentSlug: null },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, active: true },
      create: { name: c.name, slug: c.slug, active: true },
    });
  }

  const allCategories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catBySlug = new Map<string, string>(allCategories.map((c: { id: string; slug: string }) => [c.slug, c.id]));

  for (const c of categories) {
    await prisma.category.update({
      where: { slug: c.slug },
      data: { parentId: c.parentSlug ? catBySlug.get(c.parentSlug) ?? null : null },
    });
  }

  const products = [
    {
      name: 'Cable USB-C 1m Reforzado',
      slug: 'cable-usb-c-1m-reforzado',
      categorySlug: 'cables',
      description: 'Cable de carga y datos USB-C de 1 metro.',
      price: 6500,
      costPrice: 4200,
      stock: 18,
      featured: true,
      sku: 'CBL-USBC-1M',
      barcode: '7790000000011',
    },
    {
      name: 'Cable Lightning 1m',
      slug: 'cable-lightning-1m',
      categorySlug: 'cables',
      description: 'Cable compatible Lightning para carga rápida.',
      price: 7900,
      costPrice: 5100,
      stock: 9,
      featured: false,
      sku: 'CBL-LIGHT-1M',
      barcode: '7790000000012',
    },
    {
      name: 'Cargador 20W USB-C',
      slug: 'cargador-20w-usb-c',
      categorySlug: 'cargadores',
      description: 'Cargador de pared 20W USB-C.',
      price: 14500,
      costPrice: 9800,
      stock: 11,
      featured: true,
      sku: 'CRG-20W-USBC',
      barcode: '7790000000013',
    },
    {
      name: 'Parlante Bluetooth Mini',
      slug: 'parlante-bluetooth-mini',
      categorySlug: 'parlantes',
      description: 'Parlante portátil bluetooth compacto.',
      price: 23900,
      costPrice: 16200,
      stock: 6,
      featured: false,
      sku: 'PAR-BT-MINI',
      barcode: '7790000000014',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        categoryId: catBySlug.get(p.categorySlug) ?? null,
        price: new Prisma.Decimal(p.price),
        costPrice: new Prisma.Decimal(p.costPrice),
        stock: p.stock,
        active: true,
        featured: p.featured,
        sku: p.sku,
        barcode: p.barcode,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: catBySlug.get(p.categorySlug) ?? null,
        price: new Prisma.Decimal(p.price),
        costPrice: new Prisma.Decimal(p.costPrice),
        stock: p.stock,
        active: true,
        featured: p.featured,
        sku: p.sku,
        barcode: p.barcode,
      },
    });
  }
}

async function seedDeviceCatalogAndPricing() {
  const samsung = await prisma.deviceBrand.upsert({
    where: { slug: 'samsung' },
    update: { name: 'Samsung', active: true },
    create: { name: 'Samsung', slug: 'samsung', active: true },
  });

  const moto = await prisma.deviceBrand.upsert({
    where: { slug: 'motorola' },
    update: { name: 'Motorola', active: true },
    create: { name: 'Motorola', slug: 'motorola', active: true },
  });

  const models = [
    { brandId: samsung.id, name: 'A10', slug: 'a10' },
    { brandId: samsung.id, name: 'A30', slug: 'a30' },
    { brandId: moto.id, name: 'G20', slug: 'g20' },
  ];

  for (const m of models) {
    await prisma.deviceModel.upsert({
      where: { brandId_slug: { brandId: m.brandId, slug: m.slug } },
      update: { name: m.name, active: true },
      create: { brandId: m.brandId, name: m.name, slug: m.slug, active: true },
    });
  }

  const moduloIssue = await prisma.deviceIssueType.upsert({
    where: { slug: 'modulo' },
    update: { name: 'Módulo', active: true },
    create: { name: 'Módulo', slug: 'modulo', active: true },
  });
  const batteryIssue = await prisma.deviceIssueType.upsert({
    where: { slug: 'bateria' },
    update: { name: 'Batería', active: true },
    create: { name: 'Batería', slug: 'bateria', active: true },
  });

  const samsungA10 = await prisma.deviceModel.findFirstOrThrow({ where: { brandId: samsung.id, slug: 'a10' } });
  await prisma.repairPricingRule.upsert({
    where: { id: 'seed-repair-rule-samsung-a10-modulo' },
    update: {
      name: 'Samsung A10 - Módulo',
      active: true,
      priority: 100,
      deviceBrandId: samsung.id,
      deviceModelId: samsungA10.id,
      deviceIssueTypeId: moduloIssue.id,
      deviceBrand: 'Samsung',
      deviceModel: 'A10',
      issueLabel: 'Módulo',
      basePrice: new Prisma.Decimal(18000),
      profitPercent: new Prisma.Decimal(35),
      notes: 'Regla seed para pruebas locales',
    },
    create: {
      id: 'seed-repair-rule-samsung-a10-modulo',
      name: 'Samsung A10 - Módulo',
      active: true,
      priority: 100,
      deviceBrandId: samsung.id,
      deviceModelId: samsungA10.id,
      deviceIssueTypeId: moduloIssue.id,
      deviceBrand: 'Samsung',
      deviceModel: 'A10',
      issueLabel: 'Módulo',
      basePrice: new Prisma.Decimal(18000),
      profitPercent: new Prisma.Decimal(35),
      notes: 'Regla seed para pruebas locales',
    },
  });

  await prisma.repairPricingRule.upsert({
    where: { id: 'seed-repair-rule-bateria-general' },
    update: {
      name: 'Batería general',
      active: true,
      priority: 20,
      deviceIssueTypeId: batteryIssue.id,
      issueLabel: 'Batería',
      basePrice: new Prisma.Decimal(12000),
      profitPercent: new Prisma.Decimal(30),
    },
    create: {
      id: 'seed-repair-rule-bateria-general',
      name: 'Batería general',
      active: true,
      priority: 20,
      deviceIssueTypeId: batteryIssue.id,
      issueLabel: 'Batería',
      basePrice: new Prisma.Decimal(12000),
      profitPercent: new Prisma.Decimal(30),
    },
  });
}

async function seedHelpFaq() {
  const faqs = [
    {
      question: '¿Cómo sigo mi pedido?',
      answer: 'Ingresá a "Mis pedidos" desde tu cuenta para ver estado, detalle y productos.',
      category: 'pedidos',
      sortOrder: 10,
    },
    {
      question: 'No me llega el correo de recuperación',
      answer: 'Revisá Spam o Promociones. Si no llega, esperá 1-2 minutos y volvé a intentarlo.',
      category: 'cuenta',
      sortOrder: 20,
    },
    {
      question: '¿Cómo consulto una reparación?',
      answer: 'Entrá a la sección Reparaciones y verificá el estado desde tu cuenta o usando el lookup público.',
      category: 'reparaciones',
      sortOrder: 30,
    },
  ];

  for (const faq of faqs) {
    const key = slugify(faq.question);
    await prisma.helpFaqItem.upsert({
      where: { id: `seed-faq-${key}` },
      update: { ...faq, active: true },
      create: { id: `seed-faq-${key}`, ...faq, active: true },
    });
  }
}

async function seedSettings() {
  const settings = [
    { key: 'shop_name', value: 'NicoReparaciones', group: 'business', label: 'Nombre del negocio', type: 'text' },
    { key: 'shop_phone', value: '+5490000000000', group: 'business', label: 'Teléfono WhatsApp', type: 'text' },
    { key: 'mail_from_name', value: 'NicoReparaciones', group: 'mail', label: 'Nombre remitente', type: 'text' },
    { key: 'mail_from_address', value: 'no-reply@example.local', group: 'mail', label: 'Correo remitente', type: 'email' },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: s,
      create: s,
    });
  }
}

async function main() {
  assertSeedAllowed();
  console.log('[seed] iniciando...');
  await seedCategoriesAndProducts();
  await seedDeviceCatalogAndPricing();
  await seedHelpFaq();
  await seedSettings();
  console.log('[seed] listo');
}

main()
  .catch((err) => {
    console.error('[seed] error', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
