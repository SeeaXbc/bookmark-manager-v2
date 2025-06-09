// 基本機能のE2Eテスト
const { test, expect } = require('@playwright/test');

test.describe('基本機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    const filePath = require('path').resolve(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.columns-container', { timeout: 10000 });
  });

  test('アプリケーションが正しく読み込まれる', async ({ page }) => {
    // 基本要素の存在確認
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.favorites-bar')).toBeVisible();
    await expect(page.locator('.columns-container')).toBeVisible();
    await expect(page.locator('.add-column-btn')).toBeVisible();
    
    // 初期カラムが存在することを確認
    await expect(page.locator('.column')).toHaveCount(1);
  });

  test('カラムの追加ができる', async ({ page }) => {
    const initialColumnCount = await page.locator('.column').count();
    
    // カラム追加ボタンをクリック
    await page.click('.add-column-btn');
    
    // カラムが増えることを確認
    await expect(page.locator('.column')).toHaveCount(initialColumnCount + 1);
  });

  test('ブックマークの追加ができる', async ({ page }) => {
    // カラム内で右クリック
    await page.locator('.column-content').first().click({ button: 'right' });
    
    // コンテキストメニューからブックマーク追加を選択
    await page.locator('.context-menu-list li[data-action="add-bookmark"]').click();
    
    // モーダルが開くことを確認
    await expect(page.locator('#itemModal')).toBeVisible();
    
    // フォームに入力
    await page.fill('#itemTitle', 'テストブックマーク');
    await page.fill('#itemUrl', 'https://example.com');
    
    // 保存ボタンをクリック
    await page.click('#saveItemBtn');
    
    // モーダルが閉じることを確認
    await expect(page.locator('#itemModal')).toBeHidden();
    
    // ブックマークが追加されることを確認
    await expect(page.locator('.item-content')).toContainText('テストブックマーク');
  });

  test('ヘルプモーダルが開ける', async ({ page }) => {
    // ヘルプボタンをクリック
    await page.click('#helpBtn');
    
    // ヘルプモーダルが開くことを確認
    await expect(page.locator('#helpModal')).toBeVisible();
    await expect(page.locator('#helpModal-title')).toContainText('使い方');
    
    // 閉じるボタンで閉じることを確認
    await page.click('#helpModal [data-micromodal-close]');
    await expect(page.locator('#helpModal')).toBeHidden();
  });

  test('データの永続化が機能する', async ({ page }) => {
    // テストブックマークを追加
    await page.locator('.column-content').first().click({ button: 'right' });
    await page.locator('.context-menu-list li[data-action="add-bookmark"]').click();
    await page.fill('#itemTitle', '永続化テスト');
    await page.fill('#itemUrl', 'https://test.com');
    await page.click('#saveItemBtn');
    
    // ページをリロード
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // データが復元されることを確認
    await expect(page.locator('.item-content')).toContainText('永続化テスト');
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // デスクトップサイズでの確認
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.columns-container')).toBeVisible();
    
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // レイアウトが適応することを確認
    await expect(page.locator('.columns-container')).toBeVisible();
    await expect(page.locator('.header')).toBeVisible();
  });
});