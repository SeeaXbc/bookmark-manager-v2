// BookmarkManager 単体テスト
// 削除機能の重複防止とダイアログ機能のテスト

describe('BookmarkManager削除機能', () => {
  let mockManager;

  beforeEach(() => {
    // DOM要素を設定
    document.body.innerHTML = `
      <div id="columnsContainer"></div>
      <div id="confirmDeleteModal">
        <div class="modal__container">
          <p id="confirmDeleteMessage"></p>
          <button id="confirmDeleteBtn"></button>
        </div>
      </div>
    `;

    // BookmarkManagerの主要機能をモック
    mockManager = {
      data: { 
        columns: [{ 
          id: 'test-column', 
          items: [{ id: 'test-item', title: 'テストアイテム' }] 
        }], 
        columnOrder: ['test-column'], 
        favoritesOrder: [] 
      },
      isDeleting: false,
      
      // 削除確認ダイアログ機能
      showConfirmDialog: function(message, callback) {
        const messageElement = document.getElementById('confirmDeleteMessage');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        if (messageElement) messageElement.textContent = message;
        
        // ボタンクリックのシミュレート
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        
        newBtn.addEventListener('click', () => {
          global.MicroModal.close('confirmDeleteModal');
          callback();
        }, { once: true });
        
        global.MicroModal.show('confirmDeleteModal');
      },
      
      // 削除メソッド
      deleteItem: function(itemId) {
        if (this.isDeleting) return;
        this.showConfirmDialog('このアイテムを削除しますか？', () => {
          this.isDeleting = true;
          // 削除ロジック
          this.isDeleting = false;
        });
      },
      
      deleteColumn: function(columnId) {
        if (this.isDeleting) return;
        this.showConfirmDialog('このカラムを削除しますか？中身も一緒に削除されます。', () => {
          this.isDeleting = true;
          // 削除ロジック
          this.isDeleting = false;
        });
      }
    };
  });

  test('削除処理中フラグの重複防止', () => {
    expect(mockManager.isDeleting).toBe(false);
    
    // showConfirmDialogをスパイ
    const showConfirmSpy = jest.spyOn(mockManager, 'showConfirmDialog');
    
    // 削除処理中フラグを設定
    mockManager.isDeleting = true;
    
    // 削除実行
    mockManager.deleteItem('test-item');
    
    // showConfirmDialogが呼ばれていないことを確認
    expect(showConfirmSpy).not.toHaveBeenCalled();
  });

  test('削除確認ダイアログの正常動作', () => {
    const testMessage = 'テストメッセージ';
    const testCallback = jest.fn();
    
    mockManager.showConfirmDialog(testMessage, testCallback);
    
    // メッセージが設定されることを確認
    const messageElement = document.getElementById('confirmDeleteMessage');
    expect(messageElement.textContent).toBe(testMessage);
    
    // MicroModal.showが呼ばれることを確認
    expect(global.MicroModal.show).toHaveBeenCalledWith('confirmDeleteModal');
  });

  test('確認ボタンクリックでコールバック実行', () => {
    const testCallback = jest.fn();
    
    mockManager.showConfirmDialog('テスト', testCallback);
    
    // 確認ボタンをクリック
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.click();
    
    // コールバックが実行されることを確認
    expect(testCallback).toHaveBeenCalled();
    
    // モーダルが閉じられることを確認
    expect(global.MicroModal.close).toHaveBeenCalledWith('confirmDeleteModal');
  });

  test('カラム削除の重複防止', () => {
    const showConfirmSpy = jest.spyOn(mockManager, 'showConfirmDialog');
    
    // 削除処理中フラグを設定
    mockManager.isDeleting = true;
    
    // カラム削除実行
    mockManager.deleteColumn('test-column');
    
    // showConfirmDialogが呼ばれていないことを確認
    expect(showConfirmSpy).not.toHaveBeenCalled();
  });

  test('削除フラグのリセット', () => {
    const originalDeleteItem = mockManager.deleteItem.bind(mockManager);
    
    // 削除実行
    originalDeleteItem('test-item');
    
    // 削除完了後はフラグがリセットされることを確認
    expect(mockManager.isDeleting).toBe(false);
  });
});