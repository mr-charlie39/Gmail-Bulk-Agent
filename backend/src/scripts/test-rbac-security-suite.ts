import http from 'http';
import app from '../app';
import { prisma } from '../config/db';
import { env } from '../config/env';
import bcrypt from 'bcryptjs';
import { encrypt as encryptToken, decrypt as decryptToken } from '../config/encryption';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, suite: string, details?: string) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    results.push({ suite, name, passed: false, error: 'Assertion failed', details });
    console.log(`  \x1b[31m✗\x1b[0m ${name} (FAILED)`);
    if (details) console.log(`    \x1b[33mDetails:\x1b[0m ${details}`);
  }
}

async function request(baseUrl: string, path: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}) {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

async function runTestSuite() {
  console.log('\n\x1b[1m\x1b[36m================================================================');
  console.log('   ENTERPRISE MULTI-USER RBAC & SECURITY VERIFICATION SUITE');
  console.log('================================================================\x1b[0m\n');

  // Start ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`[INFO] Test harness active on ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // SUITE 1: Administrator Authentication & Seeding
    // -------------------------------------------------------------
    console.log('\x1b[1m[SUITE 1] Administrator Authentication & Seeding\x1b[0m');
    const adminEmail = env.ADMIN_EMAIL || 'albrachars@admin.com';
    const adminPassword = env.ADMIN_INITIAL_PASSWORD || 'AdminSecure@2026!';

    const adminLoginRes = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword },
    });

    assert(
      adminLoginRes.status === 200,
      'Initial admin authentication returns HTTP 200',
      'SUITE 1'
    );
    assert(
      adminLoginRes.data?.user?.role === 'ADMIN',
      'Authenticated admin has role: ADMIN',
      'SUITE 1',
      `Role: ${adminLoginRes.data?.user?.role}`
    );
    assert(
      !!adminLoginRes.data?.token,
      'JWT session token issued upon successful authentication',
      'SUITE 1'
    );

    const adminToken = adminLoginRes.data?.token;
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}` };

    // Test password hashing in DB
    const adminRecord = await prisma.user.findUnique({ where: { email: adminEmail } });
    assert(
      !!adminRecord?.passwordHash && adminRecord.passwordHash.startsWith('$2'),
      'Admin password stored as Bcrypt hash (never plaintext)',
      'SUITE 1',
      `Hash prefix: ${adminRecord?.passwordHash.substring(0, 7)}`
    );

    // -------------------------------------------------------------
    // SUITE 2: Public Registration Prevention
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 2] Public Registration Prevention\x1b[0m');
    const pubRegisterRes = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: { email: 'hacker@public.com', password: 'password123' },
    });
    assert(
      pubRegisterRes.status === 404,
      'Public registration endpoint does not exist (Returns HTTP 404)',
      'SUITE 2'
    );

    // -------------------------------------------------------------
    // SUITE 3: Employee Account Creation by Administrator
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 3] User Management Module (Admin Provisioning)\x1b[0m');
    const testUserAEmail = `test.employee.a.${Date.now()}@outreachcorp.com`;
    const testUserBEmail = `test.employee.b.${Date.now()}@outreachcorp.com`;
    const tempPassword = 'TempSecurePassword2026!';

    // Clean up if existed
    await prisma.user.deleteMany({
      where: { email: { in: [testUserAEmail, testUserBEmail] } },
    });

    const createResA = await request(baseUrl, '/api/admin/users', {
      method: 'POST',
      headers: adminAuthHeader,
      body: {
        fullName: 'Alice Employee',
        email: testUserAEmail,
        initialPassword: tempPassword,
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    assert(
      createResA.status === 201,
      'Administrator successfully creates employee User A (HTTP 201)',
      'SUITE 3'
    );
    assert(
      createResA.data?.mustChangePassword === true,
      'Created employee account has mustChangePassword: true flag enforced',
      'SUITE 3'
    );

    const userAId = createResA.data?.id;

    const createResB = await request(baseUrl, '/api/admin/users', {
      method: 'POST',
      headers: adminAuthHeader,
      body: {
        fullName: 'Bob Employee',
        email: testUserBEmail,
        initialPassword: tempPassword,
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    assert(
      createResB.status === 201,
      'Administrator successfully creates employee User B (HTTP 201)',
      'SUITE 3'
    );
    const userBId = createResB.data?.id;

    // -------------------------------------------------------------
    // SUITE 4: Duplicate Email Prevention
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 4] Duplicate Account Validation\x1b[0m');
    const duplicateRes = await request(baseUrl, '/api/admin/users', {
      method: 'POST',
      headers: adminAuthHeader,
      body: {
        fullName: 'Duplicate Alice',
        email: testUserAEmail,
        initialPassword: tempPassword,
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    assert(
      duplicateRes.status === 409,
      'Duplicate email registration is rejected with HTTP 409 Conflict',
      'SUITE 4',
      `Response: ${JSON.stringify(duplicateRes.data)}`
    );

    // -------------------------------------------------------------
    // SUITE 5: Role-Based Route Access Control (RBAC)
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 5] Role-Based Route Access Controls (RBAC)\x1b[0m');
    const userALoginRes = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: testUserAEmail, password: tempPassword },
    });
    assert(
      userALoginRes.status === 200,
      'Employee User A logs in successfully',
      'SUITE 5'
    );
    const userAToken = userALoginRes.data?.token;
    const userAAuthHeader = { Authorization: `Bearer ${userAToken}` };

    // Employee tries to access admin routes
    const userAccessAdminUsers = await request(baseUrl, '/api/admin/users', {
      method: 'GET',
      headers: userAAuthHeader,
    });
    assert(
      userAccessAdminUsers.status === 403,
      'Non-admin User A is forbidden from GET /api/admin/users (HTTP 403)',
      'SUITE 5'
    );

    const userAccessAdminDashboard = await request(baseUrl, '/api/admin/dashboard', {
      method: 'GET',
      headers: userAAuthHeader,
    });
    assert(
      userAccessAdminDashboard.status === 403,
      'Non-admin User A is forbidden from GET /api/admin/dashboard (HTTP 403)',
      'SUITE 5'
    );

    const unauthenticatedAccess = await request(baseUrl, '/api/admin/users', {
      method: 'GET',
    });
    assert(
      unauthenticatedAccess.status === 401,
      'Unauthenticated request to protected route returns HTTP 401 Unauthorized',
      'SUITE 5'
    );

    // -------------------------------------------------------------
    // SUITE 6: Inactive Employee Account Blocking
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 6] Inactive Account Enforcement\x1b[0m');
    // Admin deactivates User B
    const deactivateRes = await request(baseUrl, `/api/admin/users/${userBId}/status`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: { status: 'INACTIVE' },
    });
    assert(
      deactivateRes.status === 200 && deactivateRes.data?.status === 'INACTIVE',
      'Admin successfully deactivates User B',
      'SUITE 6'
    );

    // Inactive User B attempts to log in
    const inactiveLoginRes = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: testUserBEmail, password: tempPassword },
    });
    assert(
      inactiveLoginRes.status === 403 && inactiveLoginRes.data?.code === 'ACCOUNT_INACTIVE',
      'Deactivated employee is blocked from logging in (HTTP 403 ACCOUNT_INACTIVE)',
      'SUITE 6',
      `Error: ${inactiveLoginRes.data?.error}`
    );

    // Admin reactivates User B
    await request(baseUrl, `/api/admin/users/${userBId}/status`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: { status: 'ACTIVE' },
    });

    // -------------------------------------------------------------
    // SUITE 7: Temporary Password Change Enforcement
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 7] Password Change Lifecycle\x1b[0m');
    const userBLoginRes = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { email: testUserBEmail, password: tempPassword },
    });
    const userBToken = userBLoginRes.data?.token;
    const userBAuthHeader = { Authorization: `Bearer ${userBToken}` };

    assert(
      userBLoginRes.data?.user?.mustChangePassword === true,
      'User B initially has mustChangePassword flag set to true',
      'SUITE 7'
    );

    const newPermanentPassword = 'PermanentSecurePassword2026!';
    const changePwRes = await request(baseUrl, '/api/auth/change-password', {
      method: 'POST',
      headers: userBAuthHeader,
      body: {
        currentPassword: tempPassword,
        newPassword: newPermanentPassword,
        confirmPassword: newPermanentPassword,
      },
    });

    assert(
      changePwRes.status === 200,
      'User B successfully updates temporary password (HTTP 200)',
      'SUITE 7'
    );

    // Verify mustChangePassword is now false
    const profileResB = await request(baseUrl, '/api/auth/me', {
      method: 'GET',
      headers: userBAuthHeader,
    });
    assert(
      profileResB.data?.mustChangePassword === false,
      'mustChangePassword flag is cleared after successful password update',
      'SUITE 7'
    );

    // -------------------------------------------------------------
    // SUITE 8: Strict Workspace & Tenant Isolation
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 8] Multi-Tenant Data Isolation\x1b[0m');
    // User A creates a recipient and a campaign
    const createRecipA = await request(baseUrl, '/api/recipients', {
      method: 'POST',
      headers: userAAuthHeader,
      body: {
        email: `target.lead.a.${Date.now()}@acmeenterprise.com`,
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Enterprise',
        category: 'ENTERPRISE',
      },
    });
    assert(
      createRecipA.status === 201,
      'User A creates an isolated recipient (HTTP 201)',
      'SUITE 8'
    );
    const recipientAId = createRecipA.data?.id;

    const createCampA = await request(baseUrl, '/api/campaigns', {
      method: 'POST',
      headers: userAAuthHeader,
      body: {
        name: 'Enterprise Outreach Campaign Alpha',
        description: 'Q4 Enterprise expansion campaign',
      },
    });
    assert(
      createCampA.status === 201,
      'User A creates an isolated campaign (HTTP 201)',
      'SUITE 8'
    );
    const campaignAId = createCampA.data?.id;

    // User B lists recipients
    const listRecipB = await request(baseUrl, '/api/recipients', {
      method: 'GET',
      headers: userBAuthHeader,
    });
    const userBRecipients = listRecipB.data as any[];
    const seesRecipA = userBRecipients.some((r) => r.id === recipientAId);
    assert(
      !seesRecipA,
      'Tenant Isolation: User B cannot see User A recipients',
      'SUITE 8'
    );

    // User B lists campaigns
    const listCampB = await request(baseUrl, '/api/campaigns', {
      method: 'GET',
      headers: userBAuthHeader,
    });
    const userBCampaigns = listCampB.data as any[];
    const seesCampA = userBCampaigns.some((c) => c.id === campaignAId);
    assert(
      !seesCampA,
      'Tenant Isolation: User B cannot see User A campaigns',
      'SUITE 8'
    );

    // User B attempts direct access to User A's campaign
    const directAccessCamp = await request(baseUrl, `/api/campaigns/${campaignAId}`, {
      method: 'GET',
      headers: userBAuthHeader,
    });
    assert(
      directAccessCamp.status === 404,
      'Tenant Isolation: Direct GET on another tenant resource returns HTTP 404',
      'SUITE 8'
    );

    // -------------------------------------------------------------
    // SUITE 9: Email Approval Gate Enforcement
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 9] Human Approval Guardrail Enforcement\x1b[0m');
    // Create an unapproved draft email directly linked to User A
    const draftEmail = await prisma.generatedEmail.create({
      data: {
        userId: userAId,
        recipientId: recipientAId,
        campaignId: campaignAId,
        subject: 'Confidential Partnership Proposal',
        body: 'Hello John,\n\nI would love to connect regarding Q4 initiatives.\n\nBest, Alice',
        bodyHtml: '<p>Hello John,<br><br>I would love to connect regarding Q4 initiatives.<br><br>Best, Alice</p>',
        approvalStatus: 'PENDING_APPROVAL',
      },
    });

    assert(
      draftEmail.approvalStatus === 'PENDING_APPROVAL',
      'Newly generated draft starts in PENDING_APPROVAL state',
      'SUITE 9'
    );

    // Attempt to dispatch without approval
    const unauthorizedSendRes = await request(baseUrl, `/api/emails/send/${draftEmail.id}`, {
      method: 'POST',
      headers: userAAuthHeader,
    });

    assert(
      unauthorizedSendRes.status === 400,
      'Unapproved draft cannot be dispatched via Gmail API (Returns HTTP 400)',
      'SUITE 9',
      `Response: ${JSON.stringify(unauthorizedSendRes.data)}`
    );

    // -------------------------------------------------------------
    // SUITE 10: AES-256-GCM Token Encryption & Leak Prevention
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 10] Cryptographic Protection & Token Encryption\x1b[0m');
    const sampleRawRefreshToken = '1//04test_google_oauth_refresh_token_sample_secret_key_xyz_12345';
    const encrypted = encryptToken(sampleRawRefreshToken);

    assert(
      encrypted.encrypted !== sampleRawRefreshToken,
      'Ciphertext is cryptographically distinct from plaintext token',
      'SUITE 10'
    );
    assert(
      encrypted.iv.length === 32, // 16 bytes hex = 32 chars
      'AES-256-GCM uses 128-bit Initialization Vector (IV)',
      'SUITE 10'
    );
    assert(
      encrypted.authTag.length === 32, // 16 bytes hex = 32 chars
      'AES-256-GCM uses 128-bit Authentication Tag',
      'SUITE 10'
    );

    const decrypted = decryptToken(encrypted.encrypted, encrypted.iv, encrypted.authTag);
    assert(
      decrypted === sampleRawRefreshToken,
      'AES-256-GCM token decryption successfully recovers original plaintext',
      'SUITE 10'
    );

    // Seed test GmailConnection for User A to verify API output masking
    await prisma.gmailConnection.upsert({
      where: { userId: userAId },
      create: {
        userId: userAId,
        gmailAddress: 'alice.test.outreach@gmail.com',
        encryptedRefreshToken: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        connected: true,
      },
      update: {
        connected: true,
      },
    });

    // Admin inspects gmail accounts API
    const adminGmailAccounts = await request(baseUrl, '/api/admin/gmail-accounts', {
      method: 'GET',
      headers: adminAuthHeader,
    });

    const userAGmailView = (adminGmailAccounts.data as any[]).find((c) => c.userId === userAId);
    assert(
      userAGmailView !== undefined,
      'Admin can inspect employee Gmail connection metadata',
      'SUITE 10'
    );
    assert(
      userAGmailView?.encryptedRefreshToken === undefined &&
        userAGmailView?.iv === undefined &&
        userAGmailView?.authTag === undefined,
      'Cryptographic tokens and refresh credentials are never exposed via API responses',
      'SUITE 10'
    );

    // -------------------------------------------------------------
    // SUITE 11: Suppression List Enforcement
    // -------------------------------------------------------------
    console.log('\n\x1b[1m[SUITE 11] Unsubscribe & Suppression List Enforcement\x1b[0m');
    const suppressedEmail = `optout.${Date.now()}@domain.com`;

    const addSuppRes = await request(baseUrl, '/api/suppression', {
      method: 'POST',
      headers: userAAuthHeader,
      body: { email: suppressedEmail, reason: 'Recipient requested unsubscribe' },
    });

    assert(
      addSuppRes.status === 201,
      'User A can register email into suppression list (HTTP 201)',
      'SUITE 11'
    );

    const listSupp = await request(baseUrl, '/api/suppression', {
      method: 'GET',
      headers: userAAuthHeader,
    });
    const found = (listSupp.data as any[]).some((s) => s.email === suppressedEmail);
    assert(
      found,
      'Suppression entry persists and is retrievable by tenant',
      'SUITE 11'
    );

    // -------------------------------------------------------------
    // Clean up temporary test accounts
    // -------------------------------------------------------------
    console.log('\n[INFO] Cleaning up test fixtures from PostgreSQL...');
    await prisma.generatedEmail.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.campaign.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.recipient.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.gmailConnection.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.suppressionEntry.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: [userAId, userBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    console.log('[INFO] Test fixtures cleaned up successfully.');

  } finally {
    server.close();
  }

  // Summary report
  console.log('\n\x1b[1m\x1b[36m================================================================');
  console.log('                   TEST SUITE EXECUTION SUMMARY');
  console.log('================================================================\x1b[0m');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total Assertions Checked: \x1b[1m${total}\x1b[0m`);
  console.log(`Passed:                   \x1b[32m\x1b[1m${passed}\x1b[0m`);
  console.log(`Failed:                   ${failed > 0 ? `\x1b[31m\x1b[1m${failed}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log(`Pass Rate:                \x1b[1m${Math.round((passed / total) * 100)}%\x1b[0m\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('\x1b[31m[FATAL ERROR IN TEST SUITE]\x1b[0m', err);
  process.exit(1);
});
