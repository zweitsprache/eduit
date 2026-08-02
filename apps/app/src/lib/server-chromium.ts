import { access } from 'node:fs/promises';
import type { Browser } from 'playwright-core';

const CHROME_PATHS = [
  process.env.CHROMIUM_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter((path): path is string => Boolean(path));

export async function findServerChromium() {
  for (const executablePath of CHROME_PATHS) {
    try {
      await access(executablePath);
      return { args: [] as string[], executablePath };
    } catch {
      // Try the next local browser.
    }
  }
  try {
    const { default: serverlessChromium } = await import('@sparticuz/chromium');
    return {
      args: serverlessChromium.args,
      executablePath: await serverlessChromium.executablePath(),
    };
  } catch (error) {
    console.error('Could not prepare serverless Chromium.', error);
    return null;
  }
}

function appendTokenToEndpoint(endpoint: string, token: string) {
  const url = new URL(endpoint);
  if (!url.searchParams.has('token')) {
    url.searchParams.set('token', token);
  }
  return url.toString();
}

function normalizeBrowserlessEndpoint(endpoint: string) {
  if (endpoint.startsWith('https://')) {
    return `wss://${endpoint.slice('https://'.length)}`;
  }
  if (endpoint.startsWith('http://')) {
    return `ws://${endpoint.slice('http://'.length)}`;
  }
  return endpoint;
}

export function getBrowserlessEndpoint() {
  const endpoint =
    process.env.BROWSERLESS_WS_ENDPOINT
    ?? process.env.BROWSERLESS_URL
    ?? process.env.BROWSERLESS_ENDPOINT;
  if (!endpoint) {
    return null;
  }

  const normalizedEndpoint = normalizeBrowserlessEndpoint(endpoint);
  const token =
    process.env.BROWSERLESS_TOKEN
    ?? process.env.BROWSERLESS_API_KEY
    ?? process.env.BROWSERLESS_API_TOKEN;

  if (!token) {
    return normalizedEndpoint;
  }

  try {
    return appendTokenToEndpoint(normalizedEndpoint, token);
  } catch {
    return normalizedEndpoint;
  }
}

export async function launchRenderingBrowser({
  preferLocal = false,
}: { preferLocal?: boolean } = {}): Promise<Browser> {
  const [{ chromium }, browserlessEndpoint] = await Promise.all([
    import('playwright-core'),
    Promise.resolve(getBrowserlessEndpoint()),
  ]);

  if (browserlessEndpoint && !preferLocal) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await chromium.connectOverCDP(browserlessEndpoint);
      } catch (error) {
        console.error(`Could not connect to Browserless (attempt ${attempt}/3).`, error);
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
        }
      }
    }
  }

  const chrome = await findServerChromium();
  if (!chrome) {
    throw new Error(
      'Chrome is unavailable. Configure Browserless or CHROMIUM_EXECUTABLE_PATH on the server.',
    );
  }

  return chromium.launch({
    args: chrome.args,
    executablePath: chrome.executablePath,
    headless: true,
  });
}
