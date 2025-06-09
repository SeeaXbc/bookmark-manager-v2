// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  
  use: {
    // file://プロトコルでの絶対パス指定
    baseURL: `file://${path.resolve(__dirname, 'index.html')}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // ヘッドレスモードでの安定化設定
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // WSL環境での安定化設定
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ],
        },
      },
    },
    // 必要に応じて他のブラウザも有効化
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});