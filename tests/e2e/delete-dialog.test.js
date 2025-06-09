// 削除確認ダイアログのE2Eテスト
// 実際のブラウザでの動作を検証

const { test, expect } = require('@playwright/test');

test.describe('削除確認ダイアログ', () => {
  test.beforeEach(async ({ page }) => {
    // index.htmlをロード
    const filePath = require('path').resolve(__dirname, '../../index.html');
    await page.goto(`file://${filePath}`);
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');
    
    // アプリケーションが初期化されるまで待機
    await page.waitForSelector('.columns-container', { timeout: 10000 });
  });

  test('ブックマーク削除ダイアログが正しく動作する', async ({ page }) => {
    // テスト用ブックマークを追加
    await page.evaluate(() => {
      const manager = window.bookmarkManager || new BookmarkManager();
      window.bookmarkManager = manager;
      
      // テスト用のブックマークを追加
      const testBookmark = {
        id: 'test-bookmark-1',
        type: 'bookmark',
        title: 'テストブックマーク',
        url: 'https://example.com',
        icon: 'fas fa-bookmark'
      };
      
      if (manager.data.columns.length > 0) {
        manager.data.columns[0].items.push(testBookmark);
        manager.render();
      }
    });

    // ブックマークが表示されることを確認
    await expect(page.locator('.item-content')).toContainText('テストブックマーク');

    // ブックマークを右クリック
    await page.locator('.item-content').first().click({ button: 'right' });

    // コンテキストメニューが表示されることを確認
    await expect(page.locator('.context-menu')).toBeVisible();

    // 削除メニューをクリック
    await page.locator('.context-menu-list li[data-action="delete-item"]').click();

    // 削除確認ダイアログが表示されることを確認
    await expect(page.locator('#confirmDeleteModal')).toBeVisible();
    await expect(page.locator('#confirmDeleteMessage')).toContainText('このアイテムを削除しますか？');

    // キャンセルボタンをテスト
    await page.locator('#confirmDeleteModal [data-micromodal-close]').click();
    await expect(page.locator('#confirmDeleteModal')).toBeHidden();

    // ブックマークがまだ存在することを確認
    await expect(page.locator('.item-content')).toContainText('テストブックマーク');

    // 再度削除を試行
    await page.locator('.item-content').first().click({ button: 'right' });
    await page.locator('.context-menu-list li[data-action="delete-item"]').click();

    // 今度は削除を実行
    await page.locator('#confirmDeleteBtn').click();

    // ダイアログが閉じられることを確認
    await expect(page.locator('#confirmDeleteModal')).toBeHidden();

    // ブックマークが削除されていることを確認
    await expect(page.locator('.item-content')).not.toContainText('テストブックマーク');
  });

  test('カラム削除ダイアログが正しく動作する', async ({ page }) => {
    // カラムが存在することを確認
    await expect(page.locator('.column')).toHaveCount(1);

    // カラムヘッダーの削除ボタンをクリック
    await page.locator('.column-header .column-action[data-action="delete-column"]').click();

    // 削除確認ダイアログが表示されることを確認
    await expect(page.locator('#confirmDeleteModal')).toBeVisible();
    await expect(page.locator('#confirmDeleteMessage')).toContainText('このカラムを削除しますか？中身も一緒に削除されます。');

    // キャンセルボタンをテスト
    await page.locator('#confirmDeleteModal [data-micromodal-close]').click();
    await expect(page.locator('#confirmDeleteModal')).toBeHidden();

    // カラムがまだ存在することを確認
    await expect(page.locator('.column')).toHaveCount(1);
  });

  test('削除ダイアログの重複表示を防ぐ', async ({ page }) => {
    // テスト用ブックマークを追加
    await page.evaluate(() => {
      const manager = window.bookmarkManager || new BookmarkManager();
      window.bookmarkManager = manager;
      
      const testBookmark = {
        id: 'test-bookmark-rapid',
        type: 'bookmark',
        title: 'ラピッドテスト',
        url: 'https://example.com'
      };
      
      if (manager.data.columns.length > 0) {
        manager.data.columns[0].items.push(testBookmark);
        manager.render();
      }
    });

    // ブックマークを右クリック
    await page.locator('.item-content').first().click({ button: 'right' });
    await page.locator('.context-menu-list li[data-action="delete-item"]').click();

    // ダイアログが表示されることを確認
    await expect(page.locator('#confirmDeleteModal')).toBeVisible();

    // 複数回クリックを高速で実行
    await Promise.all([
      page.locator('#confirmDeleteBtn').click(),
      page.locator('#confirmDeleteBtn').click(),
      page.locator('#confirmDeleteBtn').click()
    ]);

    // ダイアログが適切に閉じられることを確認
    await expect(page.locator('#confirmDeleteModal')).toBeHidden();

    // アプリケーションが正常状態であることを確認
    await expect(page.locator('.columns-container')).toBeVisible();
  });

  test('削除確認ダイアログのアクセシビリティ', async ({ page }) => {
    // テスト用ブックマークを追加
    await page.evaluate(() => {
      const manager = window.bookmarkManager || new BookmarkManager();
      window.bookmarkManager = manager;
      
      const testBookmark = {
        id: 'test-a11y',
        type: 'bookmark',
        title: 'アクセシビリティテスト',
        url: 'https://example.com'
      };
      
      if (manager.data.columns.length > 0) {
        manager.data.columns[0].items.push(testBookmark);
        manager.render();
      }
    });

    // 削除ダイアログを開く
    await page.locator('.item-content').first().click({ button: 'right' });
    await page.locator('.context-menu-list li[data-action="delete-item"]').click();

    // ARIA属性が正しく設定されていることを確認
    const modal = page.locator('#confirmDeleteModal');
    await expect(modal).toHaveAttribute('aria-hidden', 'false');
    await expect(modal.locator('.modal__container')).toHaveAttribute('role', 'dialog');
    await expect(modal.locator('.modal__container')).toHaveAttribute('aria-modal', 'true');

    // Escapeキーでダイアログが閉じることを確認
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('削除ボタンのスタイリング確認', async ({ page }) => {
    // テスト用ブックマークを追加
    await page.evaluate(() => {
      const manager = window.bookmarkManager || new BookmarkManager();
      window.bookmarkManager = manager;
      
      const testBookmark = {
        id: 'test-style',
        type: 'bookmark',
        title: 'スタイルテスト',
        url: 'https://example.com'
      };
      
      if (manager.data.columns.length > 0) {
        manager.data.columns[0].items.push(testBookmark);
        manager.render();
      }
    });

    // 削除ダイアログを開く
    await page.locator('.item-content').first().click({ button: 'right' });
    await page.locator('.context-menu-list li[data-action="delete-item"]').click();

    // 削除ボタンの警告色スタイルを確認
    const deleteBtn = page.locator('#confirmDeleteBtn');
    await expect(deleteBtn).toHaveClass(/btn-danger/);
    
    // ボタンの背景色を確認（赤系統）
    const bgColor = await deleteBtn.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bgColor).toMatch(/rgb\(220,\s*53,\s*69\)/); // Bootstrap danger color
  });
});