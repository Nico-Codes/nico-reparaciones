import { spawnSync } from 'node:child_process';

const specs = [
  'e2e/auth-register-account.spec.js',
  'e2e/store-cart-checkout.spec.js',
  'e2e/checkout-authenticated.spec.js',
  'e2e/customer-areas.spec.js',
  'e2e/repair-lookup-success.spec.js',
  'e2e/admin-access.spec.js',
  'e2e/admin-products-flow.spec.js',
  'e2e/admin-order-status-transition.spec.js',
  'e2e/admin-orders-wa-filters.spec.js',
  'e2e/admin-repairs-create-status-wa.spec.js',
];

const commands = process.platform === 'win32' ? ['npx.cmd', 'npx'] : ['npx'];
const passthroughArgs = process.argv.slice(2);

let result = null;

for (const command of commands) {
  result = spawnSync(command, ['playwright', 'test', ...specs, ...passthroughArgs], {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  if (!result.error) {
    break;
  }
}

if (result?.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
