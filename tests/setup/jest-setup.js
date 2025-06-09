// Jest セットアップファイル
// DOM テスト環境の設定

// LocalStorage モック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// MicroModal のモック
global.MicroModal = {
  init: jest.fn(),
  show: jest.fn(),
  close: jest.fn(),
};

// SortableJS のモック
global.Sortable = {
  create: jest.fn(() => ({
    destroy: jest.fn(),
  })),
};

// Vanilla Picker のモック
global.Picker = jest.fn().mockImplementation(() => ({
  show: jest.fn(),
  hide: jest.fn(),
  destroy: jest.fn(),
}));

// console.log/error のモック（テスト出力を静粛化）
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

// テスト前にDOMをクリーンアップ
beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  jest.clearAllMocks();
});