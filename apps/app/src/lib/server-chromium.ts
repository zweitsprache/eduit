import { access } from 'node:fs/promises';

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
