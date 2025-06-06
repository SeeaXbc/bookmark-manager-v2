// Bookmark Manager v2 - Main JavaScript File

class BookmarkManager {
    constructor() {
        this.data = {
            appSettings: {},
            columns: [],
            columnOrder: [],
            favoritesOrder: []
        };
        
        this.currentEditingItem = null;
        this.currentEditingColumn = null;
        this.contextMenuTarget = null;
        this.colorPicker = null;
        this.selectedIcon = 'fas fa-bookmark';
        this.iconData = this.getIconData();
        
        this.init();
    }
    
    // Initialize the application
    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializeLibraries();
        this.render();
    }
    
    // Generate UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Convert hex color to rgba with opacity
    hexToRgba(hex, opacity) {
        if (!hex) return 'transparent';
        
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse RGB values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // Data Management
    loadData() {
        const savedData = localStorage.getItem('bookmarkManager');
        if (savedData) {
            this.data = JSON.parse(savedData);
        } else {
            // Create initial column if no data exists
            this.addColumn();
        }
    }
    
    saveData() {
        localStorage.setItem('bookmarkManager', JSON.stringify(this.data));
    }
    
    // Library Initialization
    initializeLibraries() {
        // Initialize Micromodal
        MicroModal.init({
            onShow: modal => console.log(`${modal.id} is shown`),
            onClose: modal => console.log(`${modal.id} is hidden`),
            openTrigger: 'data-custom-open',
            closeTrigger: 'data-custom-close',
            disableScroll: true,
            disableFocus: false,
            awaitOpenAnimation: false,
            awaitCloseAnimation: false,
            debugMode: true
        });
    }
    
    // Event Listeners
    setupEventListeners() {
        // Add Column Button
        document.getElementById('addColumnBtn').addEventListener('click', () => {
            this.addColumn();
        });
        
        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e);
        });
        
        // Context Menu
        document.addEventListener('contextmenu', (e) => {
            this.showContextMenu(e);
        });
        
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // Modal Form
        document.getElementById('itemType').addEventListener('change', () => {
            this.toggleFormFields();
        });
        
        document.getElementById('saveItemBtn').addEventListener('click', () => {
            this.saveItem();
        });
        
        // Icon Picker
        document.getElementById('iconPickerBtn').addEventListener('click', () => {
            this.openIconPicker();
        });
        
        // Prevent context menu on modal
        document.querySelector('.modal__overlay').addEventListener('contextmenu', (e) => {
            e.stopPropagation();
        });
    }
    
    // Column Management
    addColumn() {
        const columnId = this.generateUUID();
        const newColumn = {
            id: columnId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: []
        };
        
        this.data.columns.push(newColumn);
        this.data.columnOrder.push(columnId);
        this.saveData();
        this.renderColumns();
        this.setupColumnSortable();
    }
    
    deleteColumn(columnId) {
        if (confirm('このカラムを削除しますか？中身も一緒に削除されます。')) {
            this.data.columns = this.data.columns.filter(col => col.id !== columnId);
            this.data.columnOrder = this.data.columnOrder.filter(id => id !== columnId);
            
            // Remove favorites from deleted column
            this.data.favoritesOrder = this.data.favoritesOrder.filter(favId => {
                const item = this.findItemById(favId);
                return item !== null;
            });
            
            this.saveData();
            this.render();
        }
    }
    
    // Item Management
    findItemById(itemId, items = null) {
        if (!items) {
            for (const column of this.data.columns) {
                const found = this.findItemById(itemId, column.items);
                if (found) return found;
            }
            return null;
        }
        
        for (const item of items) {
            if (item.id === itemId) return item;
            if (item.children) {
                const found = this.findItemById(itemId, item.children);
                if (found) return found;
            }
        }
        return null;
    }
    
    addItem(columnId, parentId = null, type = 'bookmark') {
        this.currentEditingColumn = columnId;
        this.currentEditingItem = {
            parentId: parentId,
            isNew: true,
            type: type
        };
        
        this.openItemModal(type);
    }
    
    editItem(itemId) {
        const item = this.findItemById(itemId);
        if (item) {
            this.currentEditingItem = { ...item, isNew: false };
            this.openItemModal(item.type);
        }
    }
    
    deleteItem(itemId) {
        if (confirm('このアイテムを削除しますか？')) {
            this.removeItemRecursive(itemId);
            
            // Remove from favorites if it exists
            this.data.favoritesOrder = this.data.favoritesOrder.filter(id => id !== itemId);
            
            this.saveData();
            this.render();
        }
    }
    
    removeItemRecursive(itemId, items = null) {
        if (!items) {
            for (const column of this.data.columns) {
                if (this.removeItemRecursive(itemId, column.items)) {
                    return true;
                }
            }
            return false;
        }
        
        const index = items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            items.splice(index, 1);
            return true;
        }
        
        for (const item of items) {
            if (item.children && this.removeItemRecursive(itemId, item.children)) {
                return true;
            }
        }
        return false;
    }
    
    toggleFavorite(itemId) {
        const item = this.findItemById(itemId);
        if (item && item.type === 'bookmark') {
            item.isFavorite = !item.isFavorite;
            
            if (item.isFavorite) {
                if (!this.data.favoritesOrder.includes(itemId)) {
                    this.data.favoritesOrder.push(itemId);
                }
            } else {
                this.data.favoritesOrder = this.data.favoritesOrder.filter(id => id !== itemId);
            }
            
            this.saveData();
            this.render();
        }
    }
    
    // Modal Management
    openItemModal(type) {
        const modal = document.getElementById('itemModal');
        const titleEl = document.getElementById('itemModal-title');
        const form = document.getElementById('itemForm');
        
        // Reset form
        form.reset();
        
        // Set title
        titleEl.textContent = this.currentEditingItem.isNew ? 
            (type === 'bookmark' ? 'ブックマークを追加' : 'フォルダを追加') :
            (type === 'bookmark' ? 'ブックマークを編集' : 'フォルダを編集');
        
        // Set form values if editing
        if (!this.currentEditingItem.isNew) {
            document.getElementById('itemType').value = this.currentEditingItem.type;
            document.getElementById('itemTitle').value = this.currentEditingItem.title || '';
            document.getElementById('itemUrl').value = this.currentEditingItem.url || '';
            const currentIcon = this.currentEditingItem.icon || 'fas fa-bookmark';
            document.getElementById('itemIcon').value = currentIcon;
            document.getElementById('selectedIconPreview').className = currentIcon;
            document.getElementById('itemFavorite').checked = this.currentEditingItem.isFavorite || false;
            document.getElementById('itemColor').value = this.currentEditingItem.color || '#ffffff';
        } else {
            document.getElementById('itemType').value = type;
            const defaultIcon = 'fas fa-bookmark';
            document.getElementById('itemIcon').value = defaultIcon;
            document.getElementById('selectedIconPreview').className = defaultIcon;
        }
        
        this.toggleFormFields();
        this.initColorPicker();
        
        MicroModal.show('itemModal');
    }
    
    toggleFormFields() {
        const type = document.getElementById('itemType').value;
        const bookmarkFields = document.querySelectorAll('.bookmark-only');
        const folderFields = document.querySelectorAll('.folder-only');
        
        bookmarkFields.forEach(field => {
            field.style.display = type === 'bookmark' ? 'block' : 'none';
        });
        
        folderFields.forEach(field => {
            field.style.display = type === 'folder' ? 'block' : 'none';
        });
    }
    
    initColorPicker() {
        const colorInput = document.getElementById('itemColor');
        const colorPickerContainer = document.getElementById('colorPicker');
        
        if (this.colorPicker) {
            this.colorPicker.destroy();
        }
        
        this.colorPicker = new Picker({
            parent: colorPickerContainer,
            color: colorInput.value,
            onChange: (color) => {
                colorInput.value = color.hex;
            }
        });
    }
    
    saveItem() {
        const form = document.getElementById('itemForm');
        const formData = new FormData(form);
        
        const itemData = {
            type: formData.get('type'),
            title: formData.get('title'),
            updatedAt: new Date().toISOString()
        };
        
        if (itemData.type === 'bookmark') {
            itemData.url = formData.get('url');
            itemData.icon = formData.get('icon') || 'fas fa-bookmark';
            itemData.isFavorite = formData.has('isFavorite');
        } else {
            itemData.color = formData.get('color');
            itemData.children = this.currentEditingItem.children || [];
        }
        
        if (this.currentEditingItem.isNew) {
            itemData.id = this.generateUUID();
            itemData.createdAt = new Date().toISOString();
            
            this.insertItem(itemData);
        } else {
            itemData.id = this.currentEditingItem.id;
            itemData.createdAt = this.currentEditingItem.createdAt;
            
            this.updateItem(itemData);
        }
        
        // Handle favorites
        if (itemData.type === 'bookmark') {
            if (itemData.isFavorite && !this.data.favoritesOrder.includes(itemData.id)) {
                this.data.favoritesOrder.push(itemData.id);
            } else if (!itemData.isFavorite) {
                this.data.favoritesOrder = this.data.favoritesOrder.filter(id => id !== itemData.id);
            }
        }
        
        this.saveData();
        this.render();
        MicroModal.close('itemModal');
    }
    
    insertItem(itemData) {
        const column = this.data.columns.find(col => col.id === this.currentEditingColumn);
        if (!column) return;
        
        if (this.currentEditingItem.parentId) {
            const parent = this.findItemById(this.currentEditingItem.parentId);
            if (parent && parent.children) {
                parent.children.push(itemData);
            }
        } else {
            column.items.push(itemData);
        }
    }
    
    updateItem(itemData) {
        const existingItem = this.findItemById(itemData.id);
        if (existingItem) {
            Object.assign(existingItem, itemData);
        }
    }
    
    // Context Menu
    showContextMenu(e) {
        e.preventDefault();
        
        const contextMenu = document.getElementById('contextMenu');
        const contextMenuList = contextMenu.querySelector('.context-menu-list');
        
        // Determine target
        const target = e.target.closest('.item-content, .column, .column-content');
        this.contextMenuTarget = target;
        
        // Generate menu items based on target
        const menuItems = this.getContextMenuItems(target);
        
        // Render menu
        contextMenuList.innerHTML = menuItems.map(item => {
            if (item.separator) {
                return '<li class="context-menu-item separator"></li>';
            }
            return `
                <li class="context-menu-item" data-action="${item.action}">
                    <i class="${item.icon}"></i>
                    ${item.text}
                </li>
            `;
        }).join('');
        
        // Add event listeners
        contextMenuList.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (action) {
                this.handleContextMenuAction(action);
                this.hideContextMenu();
            }
        });
        
        // Position and show menu
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.style.display = 'block';
        
        // Adjust position if menu goes off screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = (e.pageX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = (e.pageY - rect.height) + 'px';
        }
    }
    
    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }
    
    getContextMenuItems(target) {
        if (!target) {
            return [];
        }
        
        if (target.classList.contains('item-content')) {
            const itemId = target.dataset.itemId;
            const item = this.findItemById(itemId);
            
            const items = [
                { icon: 'fas fa-edit', text: '編集', action: 'edit-item' },
                { icon: 'fas fa-trash', text: '削除', action: 'delete-item' }
            ];
            
            if (item?.type === 'bookmark') {
                items.splice(1, 0, {
                    icon: item.isFavorite ? 'fas fa-star' : 'far fa-star',
                    text: item.isFavorite ? 'お気に入りから削除' : 'お気に入りに追加',
                    action: 'toggle-favorite'
                });
            }
            
            if (item?.type === 'folder') {
                items.push(
                    { separator: true },
                    { icon: 'fas fa-bookmark', text: 'ブックマークを追加', action: 'add-bookmark' },
                    { icon: 'fas fa-folder', text: 'フォルダを追加', action: 'add-folder' }
                );
            }
            
            return items;
        }
        
        if (target.classList.contains('column-content')) {
            const columnId = target.closest('.column').dataset.columnId;
            return [
                { icon: 'fas fa-bookmark', text: 'ブックマークを追加', action: 'add-bookmark' },
                { icon: 'fas fa-folder', text: 'フォルダを追加', action: 'add-folder' },
                { separator: true },
                { icon: 'fas fa-trash', text: 'カラムを削除', action: 'delete-column' }
            ];
        }
        
        if (target.classList.contains('column')) {
            return [
                { icon: 'fas fa-trash', text: 'カラムを削除', action: 'delete-column' }
            ];
        }
        
        return [];
    }
    
    handleContextMenuAction(action) {
        const target = this.contextMenuTarget;
        
        switch (action) {
            case 'edit-item':
                const itemId = target.dataset.itemId;
                this.editItem(itemId);
                break;
                
            case 'delete-item':
                const deleteItemId = target.dataset.itemId;
                this.deleteItem(deleteItemId);
                break;
                
            case 'toggle-favorite':
                const favItemId = target.dataset.itemId;
                this.toggleFavorite(favItemId);
                break;
                
            case 'add-bookmark':
                const bookmarkColumnId = target.closest('.column').dataset.columnId;
                const bookmarkParentId = target.classList.contains('item-content') ? target.dataset.itemId : null;
                this.addItem(bookmarkColumnId, bookmarkParentId, 'bookmark');
                break;
                
            case 'add-folder':
                const folderColumnId = target.closest('.column').dataset.columnId;
                const folderParentId = target.classList.contains('item-content') ? target.dataset.itemId : null;
                this.addItem(folderColumnId, folderParentId, 'folder');
                break;
                
            case 'delete-column':
                const columnId = target.closest('.column').dataset.columnId;
                this.deleteColumn(columnId);
                break;
        }
    }
    
    // Rendering
    render() {
        this.renderFavorites();
        this.renderColumns();
        this.setupSortable();
    }
    
    renderFavorites() {
        const favoritesContainer = document.getElementById('favoritesList');
        const favoriteItems = this.data.favoritesOrder
            .map(itemId => this.findItemById(itemId))
            .filter(item => item && item.type === 'bookmark');
        
        favoritesContainer.innerHTML = favoriteItems.map(item => `
            <div class="favorite-item" data-item-id="${item.id}">
                <i class="${item.icon || 'fas fa-bookmark'}"></i>
                <span class="title">${item.title}</span>
            </div>
        `).join('');
        
        // Add click handlers
        favoritesContainer.addEventListener('click', (e) => {
            const favoriteItem = e.target.closest('.favorite-item');
            if (favoriteItem) {
                const itemId = favoriteItem.dataset.itemId;
                const item = this.findItemById(itemId);
                if (item && item.url) {
                    window.open(item.url, '_blank');
                }
            }
        });
    }
    
    renderColumns() {
        const columnsContainer = document.getElementById('columnsContainer');
        const orderedColumns = this.data.columnOrder
            .map(id => this.data.columns.find(col => col.id === id))
            .filter(col => col);
        
        columnsContainer.innerHTML = orderedColumns.map(column => `
            <div class="column" data-column-id="${column.id}" style="width: ${column.width || '300px'}">
                <div class="column-header">
                    <div class="column-drag-handle">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="column-actions">
                        <button class="column-action-btn" data-action="delete-column" data-column-id="${column.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="column-content" data-column-id="${column.id}">
                    ${this.renderItems(column.items)}
                </div>
                <div class="column-resize-handle" data-column-id="${column.id}"></div>
            </div>
        `).join('');
        
        // Add event listeners for column actions
        document.querySelectorAll('.column-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const columnId = btn.dataset.columnId;
                
                if (action === 'delete-column') {
                    this.deleteColumn(columnId);
                }
            });
        });
        
        // Add event listeners for folder toggles
        document.querySelectorAll('.folder-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.itemId;
                this.toggleFolder(itemId);
            });
        });
        
        // Add event listeners for bookmark clicks
        document.querySelectorAll('.bookmark-content').forEach(el => {
            el.addEventListener('click', (e) => {
                // Don't trigger on right-click (context menu)
                if (e.button === 0) {
                    const itemId = el.dataset.itemId;
                    this.openBookmark(itemId);
                }
            });
        });
        
        // Add event listeners for column resize
        document.querySelectorAll('.column-resize-handle').forEach(handle => {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            let column = null;
            
            handle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                column = handle.closest('.column');
                startWidth = parseInt(window.getComputedStyle(column).width, 10);
                
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
                e.preventDefault();
            });
            
            const resize = (e) => {
                if (!isResizing) return;
                
                const width = startWidth + (e.clientX - startX);
                const minWidth = 200;
                const maxWidth = 600;
                
                if (width >= minWidth && width <= maxWidth) {
                    column.style.width = width + 'px';
                    
                    // Update column data
                    const columnId = column.dataset.columnId;
                    const columnData = this.data.columns.find(col => col.id === columnId);
                    if (columnData) {
                        columnData.width = width + 'px';
                    }
                }
            };
            
            const stopResize = () => {
                if (isResizing) {
                    isResizing = false;
                    document.removeEventListener('mousemove', resize);
                    document.removeEventListener('mouseup', stopResize);
                    
                    // Save data after resize
                    this.saveData();
                }
            };
        });
    }
    
    renderItems(items, level = 0, parentFolderColor = null) {
        return items.map(item => {
            const indent = '  '.repeat(level);
            
            // Determine background color for this item
            let backgroundColor = 'transparent';
            if (item.type === 'folder') {
                // Folders use their own color
                backgroundColor = item.color || 'transparent';
            } else {
                // Child items use parent folder color with 30% opacity
                if (parentFolderColor) {
                    backgroundColor = this.hexToRgba(parentFolderColor, 0.3);
                }
            }
            
            if (item.type === 'folder') {
                const isExpanded = !item.collapsed;
                const currentFolderColor = item.color || parentFolderColor;
                
                return `
                    <div class="tree-item folder-item" data-item-id="${item.id}">
                        <div class="item-content" data-item-id="${item.id}" style="background-color: ${backgroundColor}">
                            ${indent}<button class="folder-toggle" data-item-id="${item.id}">
                                <i class="fas fa-caret-${isExpanded ? 'down' : 'right'}"></i>
                            </button>
                            <i class="item-icon fas fa-folder"></i>
                            <span class="item-title">${item.title}</span>
                        </div>
                        <div class="folder-children ${isExpanded ? '' : 'collapsed'}">
                            ${this.renderItems(item.children || [], level + 1, currentFolderColor)}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="tree-item bookmark-item" data-item-id="${item.id}">
                        <div class="item-content bookmark-content" data-item-id="${item.id}" style="background-color: ${backgroundColor}">
                            ${indent}<span class="item-indent"></span>
                            <i class="item-icon ${item.icon || 'fas fa-bookmark'}"></i>
                            <span class="item-title">${item.title}</span>
                            ${item.isFavorite ? '<i class="item-favorite fas fa-star"></i>' : ''}
                        </div>
                    </div>
                `;
            }
        }).join('');
    }
    
    toggleFolder(itemId) {
        const item = this.findItemById(itemId);
        if (item && item.type === 'folder') {
            item.collapsed = !item.collapsed;
            this.saveData();
            this.renderColumns();
            this.setupColumnSortable();
        }
    }
    
    openBookmark(itemId) {
        const item = this.findItemById(itemId);
        if (item && item.url) {
            window.open(item.url, '_blank');
        }
    }
    
    // Sortable Setup
    setupSortable() {
        this.setupFavoritesSortable();
        this.setupColumnSortable();
    }
    
    setupFavoritesSortable() {
        const favoritesContainer = document.getElementById('favoritesList');
        if (favoritesContainer) {
            new Sortable(favoritesContainer, {
                animation: 150,
                onEnd: (evt) => {
                    const newOrder = Array.from(favoritesContainer.children).map(el => el.dataset.itemId);
                    this.data.favoritesOrder = newOrder;
                    this.saveData();
                }
            });
        }
    }
    
    setupColumnSortable() {
        const columnsContainer = document.getElementById('columnsContainer');
        if (columnsContainer) {
            new Sortable(columnsContainer, {
                animation: 150,
                onEnd: (evt) => {
                    const newOrder = Array.from(columnsContainer.children).map(el => el.dataset.columnId);
                    this.data.columnOrder = newOrder;
                    this.saveData();
                }
            });
        }
        
        // Setup sortable for each column content
        document.querySelectorAll('.column-content').forEach(columnContent => {
            new Sortable(columnContent, {
                group: 'items',
                animation: 150,
                handle: '.item-content',
                filter: '.folder-children',
                onEnd: (evt) => {
                    this.handleItemMove(evt);
                }
            });
        });
        
        // Setup sortable for folder children
        document.querySelectorAll('.folder-children').forEach(folderChildren => {
            new Sortable(folderChildren, {
                group: 'items',
                animation: 150,
                handle: '.item-content',
                onEnd: (evt) => {
                    this.handleItemMove(evt);
                }
            });
        });
    }
    
    handleItemMove(evt) {
        const itemId = evt.item.dataset.itemId;
        const newIndex = evt.newIndex;
        
        // Get the moved item
        const item = this.findItemById(itemId);
        if (!item) return;
        
        // Remove item from old location
        this.removeItemRecursive(itemId);
        
        // Determine new location
        const toElement = evt.to;
        let targetArray = null;
        
        if (toElement.classList.contains('column-content')) {
            // Moving to column root
            const columnId = toElement.dataset.columnId;
            const column = this.data.columns.find(col => col.id === columnId);
            if (column) {
                targetArray = column.items;
            }
        } else if (toElement.classList.contains('folder-children')) {
            // Moving to folder
            const folderElement = toElement.closest('.folder-item');
            const folderId = folderElement?.dataset.itemId;
            const folder = this.findItemById(folderId);
            if (folder && folder.children) {
                targetArray = folder.children;
            }
        }
        
        // Insert item at new location
        if (targetArray) {
            targetArray.splice(newIndex, 0, item);
        }
        
        this.saveData();
        this.renderColumns();
        this.setupColumnSortable();
    }
    
    // Icon Picker Data
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
    
    // Icon Picker Methods
    openIconPicker() {
        this.selectedIcon = document.getElementById('itemIcon').value || 'fas fa-bookmark';
        this.renderIconPicker();
        MicroModal.show('iconPickerModal');
    }
    
    renderIconPicker() {
        const iconGrid = document.getElementById('iconGrid');
        const searchInput = document.getElementById('iconSearch');
        const categoryBtns = document.querySelectorAll('.icon-category-btn');
        
        // Setup search
        searchInput.addEventListener('input', () => {
            this.filterIcons();
        });
        
        // Setup category buttons
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterIcons();
            });
        });
        
        this.filterIcons();
    }
    
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
        
        // Add click handlers
        iconGrid.addEventListener('click', (e) => {
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
                MicroModal.close('iconPickerModal');
            }
        });
    }
    
    // Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `bookmarks_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
    
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (confirm('データをインポートしますか？現在のデータは上書きされます。')) {
                    this.data = importedData;
                    this.saveData();
                    this.render();
                }
            } catch (error) {
                alert('ファイルの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }
}

// Initialize the application
let bookmarkManager;
document.addEventListener('DOMContentLoaded', () => {
    bookmarkManager = new BookmarkManager();
});