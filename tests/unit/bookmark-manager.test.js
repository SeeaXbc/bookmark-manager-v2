// BookmarkManager 単体テスト
// DOM環境での BookmarkManager クラスのテスト

// script.js を読み込み
const fs = require('fs');
const path = require('path');

// script.js の内容を取得して評価
const scriptPath = path.join(__dirname, '../../script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// DOM環境でスクリプトを実行
beforeAll(() => {
  // 基本的なHTMLを設定
  document.body.innerHTML = `
    <div id="confirmDeleteModal">
      <p id="confirmDeleteMessage"></p>
      <button id="confirmDeleteBtn"></button>
    </div>
  `;
  
  // script.js を評価してBookmarkManagerクラスを利用可能にする
  eval(scriptContent);
});

describe('BookmarkManager', () => {
  let manager;

  beforeEach(() => {
    // LocalStorageをクリア
    localStorage.clear();
    
    // BookmarkManagerインスタンスを作成
    manager = new BookmarkManager();
  });

  describe('初期化', () => {
    test('BookmarkManagerが正しく初期化される', () => {
      expect(manager).toBeDefined();
      expect(manager.data).toBeDefined();
      expect(manager.data.columns).toEqual(expect.any(Array));
      expect(manager.isDeleting).toBe(false);
    });

    test('初期状態でカラムが作成される', () => {
      expect(manager.data.columns.length).toBeGreaterThan(0);
      expect(manager.data.columnOrder.length).toBeGreaterThan(0);
    });
  });

  describe('削除機能', () => {
    beforeEach(() => {
      // テスト用のカラムとアイテムを追加
      const testColumn = {
        id: 'test-column',
        title: 'テストカラム',
        items: [
          {
            id: 'test-item-1',
            type: 'bookmark',
            title: 'テストブックマーク',
            url: 'https://example.com'
          }
        ]
      };
      manager.data.columns.push(testColumn);
      manager.data.columnOrder.push('test-column');
    });

    test('deleteItem: 削除処理中フラグが正しく動作する', () => {
      // 削除処理中でない状態
      expect(manager.isDeleting).toBe(false);
      
      // showConfirmDialogをモック
      manager.showConfirmDialog = jest.fn((message, callback) => {
        // コールバックを実行して削除処理をシミュレート
        callback();
      });
      
      // アイテム削除を実行
      manager.deleteItem('test-item-1');
      
      // showConfirmDialogが呼ばれたことを確認
      expect(manager.showConfirmDialog).toHaveBeenCalledWith(
        'このアイテムを削除しますか？',
        expect.any(Function)
      );
    });

    test('deleteItem: 削除処理中の重複実行を防ぐ', () => {
      // 削除処理中フラグを設定
      manager.isDeleting = true;
      
      // showConfirmDialogをモック
      manager.showConfirmDialog = jest.fn();
      
      // アイテム削除を実行
      manager.deleteItem('test-item-1');
      
      // showConfirmDialogが呼ばれていないことを確認
      expect(manager.showConfirmDialog).not.toHaveBeenCalled();
    });

    test('deleteColumn: 削除処理中の重複実行を防ぐ', () => {
      // 削除処理中フラグを設定
      manager.isDeleting = true;
      
      // showConfirmDialogをモック
      manager.showConfirmDialog = jest.fn();
      
      // カラム削除を実行
      manager.deleteColumn('test-column');
      
      // showConfirmDialogが呼ばれていないことを確認
      expect(manager.showConfirmDialog).not.toHaveBeenCalled();
    });

    test('findItemById: アイテムを正しく検索できる', () => {
      const foundItem = manager.findItemById('test-item-1');
      expect(foundItem).toBeDefined();
      expect(foundItem.id).toBe('test-item-1');
      expect(foundItem.title).toBe('テストブックマーク');
    });

    test('findItemById: 存在しないアイテムはnullを返す', () => {
      const foundItem = manager.findItemById('non-existent-item');
      expect(foundItem).toBeNull();
    });
  });

  describe('データ管理', () => {
    test('saveData: localStorageにデータが保存される', () => {
      manager.saveData();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'bookmarkManager',
        expect.any(String)
      );
    });

    test('loadData: localStorageからデータが読み込まれる', () => {
      // テストデータを設定
      const testData = {
        columns: [{id: 'test', title: 'Test', items: []}],
        columnOrder: ['test'],
        favoritesOrder: []
      };
      localStorage.getItem.mockReturnValue(JSON.stringify(testData));
      
      // 新しいインスタンスでloadDataをテスト
      const newManager = new BookmarkManager();
      expect(newManager.data.columns).toEqual(testData.columns);
    });

    test('generateUUID: 有効なUUIDが生成される', () => {
      const uuid = manager.generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('showConfirmDialog', () => {
    test('確認ダイアログが正しく設定される', () => {
      const testMessage = 'テストメッセージ';
      const testCallback = jest.fn();
      
      manager.showConfirmDialog(testMessage, testCallback);
      
      // メッセージが設定されることを確認
      const messageElement = document.getElementById('confirmDeleteMessage');
      expect(messageElement.textContent).toBe(testMessage);
      
      // MicroModal.showが呼ばれることを確認
      expect(global.MicroModal.show).toHaveBeenCalledWith('confirmDeleteModal');
    });

    test('確認ボタンクリックでコールバックが実行される', () => {
      const testCallback = jest.fn();
      
      manager.showConfirmDialog('テスト', testCallback);
      
      // 確認ボタンを取得してクリックをシミュレート
      const confirmBtn = document.getElementById('confirmDeleteBtn');
      confirmBtn.click();
      
      // コールバックが実行されることを確認
      expect(testCallback).toHaveBeenCalled();
      
      // モーダルが閉じられることを確認
      expect(global.MicroModal.close).toHaveBeenCalledWith('confirmDeleteModal');
    });
  });
});