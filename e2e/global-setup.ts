import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load the backend .env so we have the Supabase service-role key
const backendEnv = path.resolve(__dirname, '../../LLPBackend/.env');
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
}
// Also load the frontend .env.local in case keys are duplicated there
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? 'e2e@llp-test.local';
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'Test1234!';

export default async function globalSetup() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn(
      '\n⚠  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not found.\n' +
      '   Make sure LLPBackend/.env is filled in or add them to LLPWebsite/.env.local.\n' +
      '   E2E tests that require login will fail.\n',
    );
    return;
  }

  const admin = createClient(url, serviceKey);

  // Check if test user already exists
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === E2E_EMAIL);

  if (found) {
    console.log(`\n✓ E2E test user already exists: ${E2E_EMAIL}\n`);
    return;
  }

  // Create the user
  const { data, error } = await admin.auth.admin.createUser({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    email_confirm: true,
  });

  if (error || !data.user) {
    console.error(`\n✗ Failed to create E2E test user: ${error?.message}\n`);
    return;
  }

  // Create profile row
  const { error: profileErr } = await admin.from('profiles').insert({
    id: data.user.id,
    name: 'E2E Tester',
    first_name: '',
    last_name: '',
  });

  if (profileErr) {
    console.error(`\n✗ Failed to create E2E profile: ${profileErr.message}\n`);
    return;
  }

  console.log(`\n✓ E2E test user created: ${E2E_EMAIL}\n`);
}
