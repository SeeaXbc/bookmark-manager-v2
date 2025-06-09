// アイコン関連機能を管理するサービス
// 自動アイコン取得、アイコンピッカー、URL判定などを提供

class IconService {
    constructor() {
        // アイコンキャッシュ
        this.iconCache = new Map();
        
        // アイコンピッカー関連の状態
        this.selectedIcon = 'fas fa-bookmark';
        this.iconSearchHandler = null;
        this.iconCategoryHandlers = [];
        this.iconGridHandler = null;
        this.iconEscapeHandler = null;
        
        // アイコンデータの初期化
        this.iconData = this.getIconData();
    }
    
    // ===== 自動アイコン取得機能 =====
    
    // URLから自動的にアイコンを取得
    async fetchIconForUrl(url) {
        if (!url) return 'fas fa-bookmark';
        
        const domain = Utils.extractDomain(url);
        if (!domain) return 'fas fa-bookmark';
        
        // キャッシュから確認
        if (this.iconCache.has(domain)) {
            return this.iconCache.get(domain);
        }
        
        try {
            // 複数のAPIを順次試行
            const methods = [
                () => this.fetchFromGoogleFavicon(domain),
                () => this.fetchFromDuckDuckGo(domain),
                () => this.getIconFromUrlPattern(url)
            ];
            
            for (const method of methods) {
                const icon = await method();
                if (icon && icon !== 'fas fa-bookmark') {
                    this.iconCache.set(domain, icon);
                    return icon;
                }
            }
            
            // すべて失敗した場合は既存のロジックを使用
            const fallbackIcon = this.getIconFromUrlPattern(url);
            this.iconCache.set(domain, fallbackIcon);
            return fallbackIcon;
            
        } catch (error) {
            console.warn('アイコン取得エラー:', error);
            const fallbackIcon = this.getIconFromUrlPattern(url);
            this.iconCache.set(domain, fallbackIcon);
            return fallbackIcon;
        }
    }
    
    // Google Favicon APIからアイコンを取得
    async fetchFromGoogleFavicon(domain) {
        return new Promise((resolve) => {
            const img = new Image();
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
            
            img.onload = () => {
                // アイコンが正常に読み込まれた場合、カスタムクラスを作成
                const iconClass = `custom-favicon-${domain.replace(/\./g, '-')}`;
                this.addCustomFaviconStyle(iconClass, faviconUrl);
                resolve(iconClass);
            };
            
            img.onerror = () => {
                resolve(null);
            };
            
            // タイムアウト設定（3秒）
            setTimeout(() => {
                resolve(null);
            }, 3000);
            
            img.src = faviconUrl;
        });
    }
    
    // DuckDuckGo Favicon APIからアイコンを取得
    async fetchFromDuckDuckGo(domain) {
        return new Promise((resolve) => {
            const img = new Image();
            const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
            
            img.onload = () => {
                const iconClass = `custom-favicon-ddg-${domain.replace(/\./g, '-')}`;
                this.addCustomFaviconStyle(iconClass, faviconUrl);
                resolve(iconClass);
            };
            
            img.onerror = () => {
                resolve(null);
            };
            
            // タイムアウト設定（3秒）
            setTimeout(() => {
                resolve(null);
            }, 3000);
            
            img.src = faviconUrl;
        });
    }
    
    // カスタムファビコンのCSSスタイルを追加
    addCustomFaviconStyle(className, faviconUrl) {
        // 既存のスタイルがあるかチェック
        if (document.querySelector(`style[data-favicon="${className}"]`)) {
            return;
        }
        
        const style = document.createElement('style');
        style.setAttribute('data-favicon', className);
        style.textContent = `
            .${className}::before {
                content: '';
                display: inline-block;
                width: 16px;
                height: 16px;
                background-image: url('${faviconUrl}');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                vertical-align: text-bottom;
            }
        `;
        document.head.appendChild(style);
    }
    
    // URLパターンから既存のロジックでアイコンを判定
    getIconFromUrlPattern(url) {
        if (!url) return 'fas fa-bookmark';
        
        const domain = url.toLowerCase();
        
        // 既存のロジックを使用（script.jsから移植）
        if (domain.includes('google.com')) return 'fab fa-google';
        if (domain.includes('github.com')) return 'fab fa-github';
        if (domain.includes('youtube.com')) return 'fab fa-youtube';
        if (domain.includes('twitter.com') || domain.includes('x.com')) return 'fab fa-twitter';
        if (domain.includes('facebook.com')) return 'fab fa-facebook';
        if (domain.includes('instagram.com')) return 'fab fa-instagram';
        if (domain.includes('linkedin.com')) return 'fab fa-linkedin';
        if (domain.includes('amazon.com') || domain.includes('amazon.co.jp')) return 'fab fa-amazon';
        if (domain.includes('netflix.com')) return 'fas fa-film';
        if (domain.includes('spotify.com')) return 'fab fa-spotify';
        if (domain.includes('stackoverflow.com')) return 'fab fa-stack-overflow';
        if (domain.includes('reddit.com')) return 'fab fa-reddit';
        if (domain.includes('wikipedia.org')) return 'fab fa-wikipedia-w';
        if (domain.includes('microsoft.com')) return 'fab fa-microsoft';
        if (domain.includes('apple.com')) return 'fab fa-apple';
        if (domain.includes('discord.com')) return 'fab fa-discord';
        if (domain.includes('slack.com')) return 'fab fa-slack';
        if (domain.includes('zoom.us')) return 'fas fa-video';
        
        // カテゴリー別の判定
        if (domain.includes('mail') || domain.includes('email')) return 'fas fa-envelope';
        if (domain.includes('news')) return 'fas fa-newspaper';
        if (domain.includes('shop') || domain.includes('store')) return 'fas fa-shopping-cart';
        if (domain.includes('game')) return 'fas fa-gamepad';
        if (domain.includes('music')) return 'fas fa-music';
        if (domain.includes('video')) return 'fas fa-video';
        if (domain.includes('photo')) return 'fas fa-camera';
        if (domain.includes('doc') || domain.includes('pdf')) return 'fas fa-file-pdf';
        
        return 'fas fa-bookmark';
    }
    
    // ===== アイコンピッカー機能 =====
    
    // アイコンデータの取得
    getIconData() {
        return {
            general: [
                'fas fa-bookmark', 'fas fa-star', 'fas fa-heart', 'fas fa-home', 'fas fa-user',
                'fas fa-cog', 'fas fa-search', 'fas fa-plus', 'fas fa-minus', 'fas fa-edit',
                'fas fa-trash', 'fas fa-save', 'fas fa-print', 'fas fa-download', 'fas fa-upload',
                'fas fa-bell', 'fas fa-envelope', 'fas fa-phone', 'fas fa-calendar', 'fas fa-clock',
                'fas fa-map-marker-alt', 'fas fa-tag', 'fas fa-tags', 'fas fa-flag', 'fas fa-info',
                'fas fa-question', 'fas fa-exclamation', 'fas fa-check', 'fas fa-times', 'fas fa-eye'
            ],
            web: [
                'fab fa-google', 'fab fa-amazon', 'fab fa-apple', 'fab fa-microsoft', 'fab fa-chrome',
                'fab fa-firefox', 'fab fa-safari', 'fab fa-edge', 'fas fa-globe', 'fas fa-wifi',
                'fas fa-rss', 'fas fa-link', 'fas fa-external-link-alt', 'fas fa-share', 'fas fa-code',
                'fas fa-terminal', 'fas fa-database', 'fas fa-server', 'fas fa-cloud', 'fas fa-shield-alt'
            ],
            social: [
                'fab fa-twitter', 'fab fa-facebook', 'fab fa-instagram', 'fab fa-linkedin', 'fab fa-youtube',
                'fab fa-tiktok', 'fab fa-discord', 'fab fa-telegram', 'fab fa-whatsapp', 'fab fa-line',
                'fab fa-skype', 'fab fa-slack', 'fab fa-zoom', 'fab fa-reddit', 'fab fa-pinterest',
                'fab fa-snapchat', 'fab fa-tumblr', 'fab fa-twitch', 'fab fa-spotify', 'fab fa-soundcloud'
            ],
            file: [
                'fas fa-file', 'fas fa-file-alt', 'fas fa-file-pdf', 'fas fa-file-word', 'fas fa-file-excel',
                'fas fa-file-powerpoint', 'fas fa-file-image', 'fas fa-file-video', 'fas fa-file-audio',
                'fas fa-file-archive', 'fas fa-file-code', 'fas fa-folder', 'fas fa-folder-open',
                'fas fa-copy', 'fas fa-cut', 'fas fa-paste', 'fas fa-clipboard', 'fas fa-paperclip',
                'fas fa-image', 'fas fa-images'
            ],
            arrow: [
                'fas fa-arrow-up', 'fas fa-arrow-down', 'fas fa-arrow-left', 'fas fa-arrow-right',
                'fas fa-arrow-circle-up', 'fas fa-arrow-circle-down', 'fas fa-arrow-circle-left', 'fas fa-arrow-circle-right',
                'fas fa-chevron-up', 'fas fa-chevron-down', 'fas fa-chevron-left', 'fas fa-chevron-right',
                'fas fa-angle-up', 'fas fa-angle-down', 'fas fa-angle-left', 'fas fa-angle-right',
                'fas fa-caret-up', 'fas fa-caret-down', 'fas fa-caret-left', 'fas fa-caret-right'
            ]
        };
    }
    
    // アイコンピッカーを開く
    openIconPicker() {
        this.selectedIcon = document.getElementById('itemIcon').value || 'fas fa-bookmark';
        
        // 親モーダル内のフォーカスをクリア
        const activeElement = document.activeElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
        }
        
        this.renderIconPicker();
        
        // MicroModalを使わず直接表示
        const iconModal = document.getElementById('iconPickerModal');
        if (iconModal) {
            iconModal.classList.add('is-open');
            iconModal.setAttribute('aria-hidden', 'false');
            
            // 検索フィールドにフォーカス
            setTimeout(() => {
                const searchInput = document.getElementById('iconSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
            
            // ESCキーで閉じる
            this.iconEscapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeIconPicker();
                    document.removeEventListener('keydown', this.iconEscapeHandler);
                }
            };
            document.addEventListener('keydown', this.iconEscapeHandler);
        }
    }
    
    // アイコンピッカーを閉じる
    closeIconPicker() {
        const iconModal = document.getElementById('iconPickerModal');
        if (iconModal) {
            iconModal.classList.remove('is-open');
            iconModal.setAttribute('aria-hidden', 'true');
            
            // ESCキーハンドラーをクリーンアップ
            if (this.iconEscapeHandler) {
                document.removeEventListener('keydown', this.iconEscapeHandler);
                this.iconEscapeHandler = null;
            }
            
            // 親モーダルにフォーカスを戻す
            setTimeout(() => {
                const titleInput = document.getElementById('itemTitle');
                if (titleInput) {
                    titleInput.focus();
                }
            }, 100);
        }
    }
    
    // アイコンピッカーの描画
    renderIconPicker() {
        const iconGrid = document.getElementById('iconGrid');
        const searchInput = document.getElementById('iconSearch');
        const categoryBtns = document.querySelectorAll('.icon-category-btn');
        
        // 既存のイベントリスナーをクリア
        if (this.iconSearchHandler) {
            searchInput.removeEventListener('input', this.iconSearchHandler);
        }
        
        // Setup search
        this.iconSearchHandler = () => {
            this.filterIcons();
        };
        searchInput.addEventListener('input', this.iconSearchHandler);
        
        // 既存のカテゴリボタンイベントリスナーをクリア
        if (this.iconCategoryHandlers) {
            categoryBtns.forEach((btn, index) => {
                if (this.iconCategoryHandlers[index]) {
                    btn.removeEventListener('click', this.iconCategoryHandlers[index]);
                }
            });
        }
        
        // Setup category buttons
        this.iconCategoryHandlers = [];
        categoryBtns.forEach((btn, index) => {
            const handler = () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterIcons();
            };
            this.iconCategoryHandlers[index] = handler;
            btn.addEventListener('click', handler);
        });
        
        this.filterIcons();
        
        // キャンセルボタンとオーバーレイクリックの処理
        const iconModal = document.getElementById('iconPickerModal');
        const iconOverlay = iconModal.querySelector('.modal__overlay');
        const iconCloseBtn = iconModal.querySelector('[data-micromodal-close]');
        
        // オーバーレイクリックで閉じる
        if (iconOverlay && !iconOverlay.hasAttribute('data-icon-picker-handled')) {
            iconOverlay.setAttribute('data-icon-picker-handled', 'true');
            iconOverlay.addEventListener('click', (e) => {
                if (e.target === iconOverlay) {
                    this.closeIconPicker();
                }
            });
        }
        
        // キャンセルボタンで閉じる
        if (iconCloseBtn && !iconCloseBtn.hasAttribute('data-icon-picker-handled')) {
            iconCloseBtn.setAttribute('data-icon-picker-handled', 'true');
            iconCloseBtn.addEventListener('click', () => {
                this.closeIconPicker();
            });
        }
        
        // フッターのキャンセルボタンも処理
        const footerCloseBtn = iconModal.querySelector('.modal__footer [data-micromodal-close]');
        if (footerCloseBtn && !footerCloseBtn.hasAttribute('data-icon-picker-handled')) {
            footerCloseBtn.setAttribute('data-icon-picker-handled', 'true');
            footerCloseBtn.addEventListener('click', () => {
                this.closeIconPicker();
            });
        }
    }
    
    // アイコンフィルタリング
    filterIcons() {
        const searchTerm = document.getElementById('iconSearch').value.toLowerCase();
        const activeCategory = document.querySelector('.icon-category-btn.active').dataset.category;
        const iconGrid = document.getElementById('iconGrid');
        
        let iconsToShow = [];
        
        if (activeCategory === 'all') {
            iconsToShow = Object.values(this.iconData).flat();
        } else {
            iconsToShow = this.iconData[activeCategory] || [];
        }
        
        // Filter by search term
        if (searchTerm) {
            iconsToShow = iconsToShow.filter(icon => 
                icon.toLowerCase().includes(searchTerm) ||
                icon.replace('fas fa-', '').replace('fab fa-', '').replace('-', ' ').includes(searchTerm)
            );
        }
        
        // Render icons
        iconGrid.innerHTML = iconsToShow.map(icon => `
            <div class="icon-item ${icon === this.selectedIcon ? 'selected' : ''}" 
                 data-icon="${icon}" 
                 title="${icon}">
                <i class="${icon}"></i>
            </div>
        `).join('');
        
        // 既存のアイコングリッドイベントリスナーをクリア
        if (this.iconGridHandler) {
            iconGrid.removeEventListener('click', this.iconGridHandler);
        }
        
        // Add click handlers
        this.iconGridHandler = (e) => {
            const iconItem = e.target.closest('.icon-item');
            if (iconItem) {
                // Remove previous selection
                iconGrid.querySelectorAll('.icon-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Add selection to clicked item
                iconItem.classList.add('selected');
                
                // Update selected icon
                this.selectedIcon = iconItem.dataset.icon;
                
                // Update input and preview
                document.getElementById('itemIcon').value = this.selectedIcon;
                document.getElementById('selectedIconPreview').className = this.selectedIcon;
                
                // Close modal
                this.closeIconPicker();
            }
        };
        iconGrid.addEventListener('click', this.iconGridHandler);
    }
}