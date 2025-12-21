/**
 * Automated Cookie Refresh for Premium News Sources
 *
 * Uses Playwright to login and extract session cookies from:
 * - NYTimes
 * - Bloomberg
 * - WSJ
 * - FT
 * - Washington Post
 *
 * Run locally: npx ts-node scripts/cookie-refresh/refresh-cookies.ts
 * Or via GitHub Actions on schedule
 */

import { chromium, Browser, Page } from 'playwright';
import { execSync } from 'child_process';

// Credentials from environment variables
const CREDENTIALS = {
  nytimes: {
    email: process.env.NYTIMES_EMAIL,
    password: process.env.NYTIMES_PASSWORD,
    loginUrl: 'https://myaccount.nytimes.com/auth/login',
    cookieDomain: '.nytimes.com',
    secretName: 'NYTIMES_AUTH_COOKIE'
  },
  bloomberg: {
    email: process.env.BLOOMBERG_EMAIL,
    password: process.env.BLOOMBERG_PASSWORD,
    loginUrl: 'https://www.bloomberg.com/account/signin',
    cookieDomain: '.bloomberg.com',
    secretName: 'BLOOMBERG_AUTH_COOKIE'
  },
  wsj: {
    email: process.env.WSJ_EMAIL,
    password: process.env.WSJ_PASSWORD,
    loginUrl: 'https://accounts.wsj.com/login',
    cookieDomain: '.wsj.com',
    secretName: 'WSJ_AUTH_COOKIE'
  },
  ft: {
    email: process.env.FT_EMAIL,
    password: process.env.FT_PASSWORD,
    loginUrl: 'https://accounts.ft.com/login',
    cookieDomain: '.ft.com',
    secretName: 'FT_AUTH_COOKIE'
  },
  wapo: {
    email: process.env.WAPO_EMAIL,
    password: process.env.WAPO_PASSWORD,
    loginUrl: 'https://www.washingtonpost.com/subscribe/signin/',
    cookieDomain: '.washingtonpost.com',
    secretName: 'WAPO_AUTH_COOKIE'
  }
};

interface CookieResult {
  source: string;
  success: boolean;
  cookieString?: string;
  error?: string;
}

async function extractCookiesFromSource(
  browser: Browser,
  sourceName: string,
  config: typeof CREDENTIALS.nytimes
): Promise<CookieResult> {
  console.log(`\n🔐 Logging into ${sourceName}...`);

  if (!config.email || !config.password) {
    return {
      source: sourceName,
      success: false,
      error: `Missing credentials for ${sourceName}`
    };
  }

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(config.loginUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a bit for any JS to load
    await page.waitForTimeout(2000);

    // Site-specific login flows
    switch (sourceName) {
      case 'nytimes':
        await loginNYTimes(page, config.email, config.password);
        break;
      case 'bloomberg':
        await loginBloomberg(page, config.email, config.password);
        break;
      case 'wsj':
        await loginWSJ(page, config.email, config.password);
        break;
      case 'ft':
        await loginFT(page, config.email, config.password);
        break;
      case 'wapo':
        await loginWaPo(page, config.email, config.password);
        break;
      default:
        throw new Error(`Unknown source: ${sourceName}`);
    }

    // Wait for login to complete
    await page.waitForTimeout(5000);

    // Extract cookies
    const cookies = await context.cookies();
    const relevantCookies = cookies.filter(c =>
      c.domain.includes(config.cookieDomain.replace('.', ''))
    );

    if (relevantCookies.length === 0) {
      throw new Error('No cookies found after login - login may have failed');
    }

    // Format as cookie string
    const cookieString = relevantCookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    console.log(`   ✅ Extracted ${relevantCookies.length} cookies for ${sourceName}`);

    await context.close();

    return {
      source: sourceName,
      success: true,
      cookieString
    };

  } catch (error: any) {
    console.error(`   ❌ Failed to login to ${sourceName}: ${error.message}`);

    // Take screenshot for debugging
    try {
      const screenshotPath = `/tmp/${sourceName}-error.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Screenshot saved: ${screenshotPath}`);

      // Also log the page URL and title
      console.log(`   📍 URL: ${page.url()}`);
      console.log(`   📄 Title: ${await page.title()}`);
    } catch {}

    await context.close();

    return {
      source: sourceName,
      success: false,
      error: error.message
    };
  }
}

// Site-specific login implementations

async function loginNYTimes(page: Page, email: string, password: string) {
  // NYTimes has a multi-step login - try multiple selector strategies
  // Wait for page to be interactive
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Try different selectors for email field
  const emailSelectors = [
    'input[name="email"]',
    'input[type="email"]',
    'input[data-testid="email-input"]',
    '#email',
    'input[autocomplete="email"]'
  ];

  let emailFilled = false;
  for (const selector of emailSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.fill(email);
        emailFilled = true;
        console.log(`   Found email field with: ${selector}`);
        break;
      }
    } catch {}
  }

  if (!emailFilled) {
    // Try by placeholder or label
    try {
      await page.getByPlaceholder(/email/i).fill(email);
      emailFilled = true;
      console.log('   Found email by placeholder');
    } catch {}
  }

  if (!emailFilled) {
    throw new Error('Could not find email input field');
  }

  // Click continue/submit button
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Try different selectors for password field
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    'input[data-testid="password-input"]',
    '#password'
  ];

  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.fill(password);
        passwordFilled = true;
        console.log(`   Found password field with: ${selector}`);
        break;
      }
    } catch {}
  }

  if (!passwordFilled) {
    throw new Error('Could not find password input field');
  }

  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
}

async function loginBloomberg(page: Page, email: string, password: string) {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
}

async function loginWSJ(page: Page, email: string, password: string) {
  // WSJ also has multi-step login
  await page.fill('input[name="username"]', email);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
}

async function loginFT(page: Page, email: string, password: string) {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
}

async function loginWaPo(page: Page, email: string, password: string) {
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
}

// Update Supabase secrets
async function updateSupabaseSecret(secretName: string, value: string): Promise<boolean> {
  try {
    console.log(`   📤 Updating Supabase secret: ${secretName}`);

    // Use Supabase CLI to set secret
    execSync(`supabase secrets set ${secretName}="${value}"`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });

    console.log(`   ✅ Updated ${secretName}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Failed to update ${secretName}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔄 Starting Cookie Refresh');
  console.log('=' .repeat(60));
  console.log(`   Time: ${new Date().toISOString()}`);

  const browser = await chromium.launch({
    headless: true, // Set to false for debugging
  });

  const results: CookieResult[] = [];

  // Process each source
  for (const [sourceName, config] of Object.entries(CREDENTIALS)) {
    // Skip if no credentials configured
    if (!config.email || !config.password) {
      console.log(`\n⏭️  Skipping ${sourceName} - no credentials configured`);
      continue;
    }

    const result = await extractCookiesFromSource(browser, sourceName, config);
    results.push(result);

    // Update Supabase secret if successful
    if (result.success && result.cookieString) {
      await updateSupabaseSecret(config.secretName, result.cookieString);
    }
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`   ✅ Successful: ${successful.length}`);
  successful.forEach(r => console.log(`      - ${r.source}`));

  if (failed.length > 0) {
    console.log(`   ❌ Failed: ${failed.length}`);
    failed.forEach(r => console.log(`      - ${r.source}: ${r.error}`));
  }

  console.log('='.repeat(60));

  // Exit with error if any failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
