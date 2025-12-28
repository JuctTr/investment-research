import puppeteer from 'puppeteer-extra';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const stealth = require('puppeteer-extra-plugin-stealth');

// 启用 stealth 插件
puppeteer.use(stealth());

export const PUPPETEER_CONFIG = {
  headless: process.env.PUPPETEER_HEADLESS === 'true' || true,
  timeout: parseInt(process.env.PUPPETEER_TIMEOUT, 10) || 30000,
  waitUntil: process.env.PUPPETEER_WAIT_UNTIL || 'networkidle2',
  userAgent:
    process.env.PUPPETEER_USER_AGENT ||
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--disable-blink-features=AutomationControlled',
  ] as string[],
};

export default puppeteer;
