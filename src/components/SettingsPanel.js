/**
 * SettingsPanel.js
 * Comprehensive settings UI component for configuring all Nizhal AI features
 */

export class SettingsPanel {
    constructor(settingsManager, container) {
        this.settingsManager = settingsManager;
        this.container = container;
        this.currentCategory = 'general';
        this.searchQuery = '';
        this.isDirty = false;
        this.panels = new Map();
        
        // UI state
        this.state = {
            activeTab: 'general',
            searchResults: [],
            showAdvanced: false,
            expandedSections: new Set()
        };
        
        console.log('[SettingsPanel] ✓ Settings panel initialized');
    }
    
    /**
     * Initialize settings panel
     */
    async initialize() {
        try {
            await this.render();
            this.setupEventListeners();
            this.loadCurrentSettings();
            console.log('[SettingsPanel] ✓ Settings panel ready');
        } catch (error) {
            console.error('[SettingsPanel] Failed to initialize:', error);
            throw error;
        }
    }
    
    /**
     * Render the settings panel
     */
    async render() {
        this.container.innerHTML = `
            <div class="settings-panel">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <div class="settings-actions">
                        <div class="search-box">
                            <input type="text" id="settings-search" placeholder="Search settings...">
                            <button class="search-btn">🔍</button>
                        </div>
                        <button class="btn btn-secondary" id="export-settings">Export</button>
                        <button class="btn btn-secondary" id="import-settings">Import</button>
                        <button class="btn btn-primary" id="save-settings" style="display: none;">Save Changes</button>
                        <button class="btn btn-danger" id="reset-settings">Reset All</button>
                    </div>
                </div>
                
                <div class="settings-content">
                    <div class="settings-sidebar">
                        <div class="category-list">
                            ${this.renderCategoryList()}
                        </div>
                    </div>
                    
                    <div class="settings-main">
                        <div class="settings-tabs">
                            ${this.renderCategoryTabs()}
                        </div>
                        
                        <div class="settings-body">
                            <div id="settings-content">
                                ${this.renderCategoryContent(this.currentCategory)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-footer">
                    <div class="settings-info">
                        <span id="settings-status">All settings up to date</span>
                        <span id="settings-modified"></span>
                    </div>
                    <div class="settings-actions-footer">
                        <button class="btn btn-secondary" id="cancel-changes" style="display: none;">Cancel</button>
                        <button class="btn btn-primary" id="apply-changes" style="display: none;">Apply Changes</button>
                    </div>
                </div>
            </div>
        `;
        
        this.setupCategoryPanels();
    }
    
    /**
     * Render category list in sidebar
     */
    renderCategoryList() {
        const categories = this.settingsManager.categories;
        const sortedCategories = Object.entries(categories)
            .sort(([,a], [,b]) => a.order - b.order);
        
        return sortedCategories.map(([key, category]) => `
            <div class="category-item ${key === this.currentCategory ? 'active' : ''}" 
                 data-category="${key}">
                <div class="category-icon">${category.icon}</div>
                <div class="category-info">
                    <div class="category-name">${category.name}</div>
                    <div class="category-description">${category.description}</div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Render category tabs
     */
    renderCategoryTabs() {
        const categories = this.settingsManager.categories;
        const sortedCategories = Object.entries(categories)
            .sort(([,a], [,b]) => a.order - b.order);
        
        return sortedCategories.map(([key, category]) => `
            <button class="tab-btn ${key === this.currentCategory ? 'active' : ''}" 
                    data-category="${key}">
                ${category.icon} ${category.name}
            </button>
        `).join('');
    }
    
    /**
     * Render category content
     */
    renderCategoryContent(category) {
        const schema = this.settingsManager.getSettingsSchema();
        const categorySchema = schema[category];
        
        if (!categorySchema) {
            return '<div class="no-content">No settings available for this category</div>';
        }
        
        return `
            <div class="category-content" data-category="${category}">
                <div class="category-header">
                    <h3>${categorySchema.icon} ${categorySchema.name}</h3>
                    <p>${categorySchema.description}</p>
                </div>
                
                <div class="settings-sections">
                    ${this.renderSettingsSections(category, categorySchema.settings)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render settings sections
     */
    renderSettingsSections(category, settings) {
        const sections = this.groupSettingsBySection(settings);
        
        return Object.entries(sections).map(([sectionName, sectionSettings]) => `
            <div class="settings-section">
                <div class="section-header">
                    <h4>${this.formatSectionName(sectionName)}</h4>
                    <button class="section-toggle" data-section="${sectionName}">
                        ${this.state.expandedSections.has(sectionName) ? '▼' : '▶'}
                    </button>
                </div>
                
                <div class="section-content ${this.state.expandedSections.has(sectionName) ? 'expanded' : ''}" 
                     data-section="${sectionName}">
                    ${Object.entries(sectionSettings).map(([key, field]) => 
                        this.renderSettingField(category, key, field)
                    ).join('')}
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Group settings by section
     */
    groupSettingsBySection(settings) {
        const sections = {};
        
        for (const [key, field] of Object.entries(settings)) {
            const section = key.split('.')[0];
            if (!sections[section]) {
                sections[section] = {};
            }
            sections[section][key] = field;
        }
        
        return sections;
    }
    
    /**
     * Format section name
     */
    formatSectionName(sectionName) {
        return sectionName.replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .trim();
    }
    
    /**
     * Render individual setting field
     */
    renderSettingField(category, key, field) {
        const currentValue = this.settingsManager.get(category, key, field.default);
        const fieldId = `${category}-${key.replace(/\./g, '-')}`;
        
        let fieldHtml = '';
        
        switch (field.type) {
            case 'boolean':
                fieldHtml = `
                    <div class="setting-field">
                        <label class="checkbox-label">
                            <input type="checkbox" 
                                   id="${fieldId}" 
                                   data-category="${category}" 
                                   data-key="${key}"
                                   ${currentValue ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            <div class="field-info">
                                <div class="field-label">${field.label}</div>
                                ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                            </div>
                        </label>
                    </div>
                `;
                break;
                
            case 'number':
                fieldHtml = `
                    <div class="setting-field">
                        <label for="${fieldId}" class="field-label">
                            ${field.label}
                            ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                        </label>
                        <input type="number" 
                               id="${fieldId}" 
                               data-category="${category}" 
                               data-key="${key}"
                               value="${currentValue}"
                               ${field.validation ? `min="${field.validation.min}" max="${field.validation.max}" step="${field.validation.step || 1}"` : ''}>
                    </div>
                `;
                break;
                
            case 'select':
                fieldHtml = `
                    <div class="setting-field">
                        <label for="${fieldId}" class="field-label">
                            ${field.label}
                            ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                        </label>
                        <select id="${fieldId}" 
                                data-category="${category}" 
                                data-key="${key}">
                            ${field.options.map(option => `
                                <option value="${option.value}" ${currentValue === option.value ? 'selected' : ''}>
                                    ${option.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;
                break;
                
            case 'array':
                fieldHtml = `
                    <div class="setting-field">
                        <label class="field-label">
                            ${field.label}
                            ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                        </label>
                        <div class="array-field" id="${fieldId}" data-category="${category}" data-key="${key}">
                            ${this.renderArrayField(currentValue, fieldId)}
                        </div>
                    </div>
                `;
                break;
                
            default:
                fieldHtml = `
                    <div class="setting-field">
                        <label for="${fieldId}" class="field-label">
                            ${field.label}
                            ${field.description ? `<div class="field-description">${field.description}</div>` : ''}
                        </label>
                        <input type="${field.type === 'password' ? 'password' : 'text'}" 
                               id="${fieldId}" 
                               data-category="${category}" 
                               data-key="${key}"
                               value="${currentValue || ''}">
                    </div>
                `;
        }
        
        return fieldHtml;
    }
    
    /**
     * Render array field
     */
    renderArrayField(value, fieldId) {
        if (!Array.isArray(value) || value.length === 0) {
            return `
                <div class="array-empty">
                    <span>No items</span>
                    <button class="btn btn-sm btn-secondary" onclick="settingsPanel.addArrayItem('${fieldId}')">
                        Add Item
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="array-items">
                ${value.map((item, index) => `
                    <div class="array-item">
                        <input type="text" value="${item}" data-index="${index}">
                        <button class="btn btn-sm btn-danger" onclick="settingsPanel.removeArrayItem('${fieldId}', ${index})">
                            ×
                        </button>
                    </div>
                `).join('')}
                <button class="btn btn-sm btn-secondary" onclick="settingsPanel.addArrayItem('${fieldId}')">
                    Add Item
                </button>
            </div>
        `;
    }
    
    /**
     * Setup category panels
     */
    setupCategoryPanels() {
        // Store panel references
        for (const category of Object.keys(this.settingsManager.categories)) {
            this.panels.set(category, {
                element: null,
                fields: new Map(),
                isDirty: false
            });
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Category navigation
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.category-item') || e.target.closest('.tab-btn')) {
                const category = e.target.closest('.category-item, .tab-btn').dataset.category;
                this.switchCategory(category);
            }
            
            // Section toggles
            if (e.target.classList.contains('section-toggle')) {
                const section = e.target.dataset.section;
                this.toggleSection(section);
            }
            
            // Settings actions
            if (e.target.id === 'save-settings' || e.target.id === 'apply-changes') {
                this.saveSettings();
            }
            
            if (e.target.id === 'cancel-changes') {
                this.cancelChanges();
            }
            
            if (e.target.id === 'reset-settings') {
                this.resetAllSettings();
            }
            
            if (e.target.id === 'export-settings') {
                this.exportSettings();
            }
            
            if (e.target.id === 'import-settings') {
                this.importSettings();
            }
        });
        
        // Search functionality
        const searchInput = this.container.querySelector('#settings-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // Field change listeners
        this.container.addEventListener('change', (e) => {
            if (e.target.dataset.category && e.target.dataset.key) {
                this.handleFieldChange(e.target);
            }
        });
        
        // Array field listeners
        this.container.addEventListener('input', (e) => {
            if (e.target.closest('.array-item input')) {
                this.handleArrayFieldChange(e.target);
            }
        });
    }
    
    /**
     * Switch to different category
     */
    switchCategory(category) {
        if (category === this.currentCategory) return;
        
        // Update active states
        this.currentCategory = category;
        
        // Update sidebar
        this.container.querySelectorAll('.category-item').forEach(item => {
            item.classList.toggle('active', item.dataset.category === category);
        });
        
        // Update tabs
        this.container.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        
        // Update content
        const contentDiv = this.container.querySelector('#settings-content');
        contentDiv.innerHTML = this.renderCategoryContent(category);
        
        // Load current settings for this category
        this.loadCategorySettings(category);
    }
    
    /**
     * Toggle section expansion
     */
    toggleSection(section) {
        if (this.state.expandedSections.has(section)) {
            this.state.expandedSections.delete(section);
        } else {
            this.state.expandedSections.add(section);
        }
        
        const sectionContent = this.container.querySelector(`.section-content[data-section="${section}"]`);
        const toggleBtn = this.container.querySelector(`.section-toggle[data-section="${section}"]`);
        
        if (sectionContent) {
            sectionContent.classList.toggle('expanded');
        }
        
        if (toggleBtn) {
            toggleBtn.textContent = this.state.expandedSections.has(section) ? '▼' : '▶';
        }
    }
    
    /**
     * Handle search
     */
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        
        if (this.searchQuery.length === 0) {
            this.clearSearch();
            return;
        }
        
        const results = this.settingsManager.searchSettings(this.searchQuery);
        this.displaySearchResults(results);
    }
    
    /**
     * Display search results
     */
    displaySearchResults(results) {
        const contentDiv = this.container.querySelector('#settings-content');
        
        if (results.length === 0) {
            contentDiv.innerHTML = `
                <div class="search-results">
                    <div class="no-results">
                        <h3>No results found</h3>
                        <p>No settings match your search for "${this.searchQuery}"</p>
                    </div>
                </div>
            `;
            return;
        }
        
        contentDiv.innerHTML = `
            <div class="search-results">
                <h3>Search Results (${results.length})</h3>
                <div class="search-items">
                    ${results.map(result => `
                        <div class="search-item" data-category="${result.category}" data-key="${result.key}">
                            <div class="search-item-header">
                                <span class="search-category">${result.categoryInfo.icon} ${result.categoryInfo.name}</span>
                                <span class="search-label">${result.label}</span>
                            </div>
                            ${result.description ? `<div class="search-description">${result.description}</div>` : ''}
                            <div class="search-value">Current: ${JSON.stringify(result.value)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add click handlers for search results
        contentDiv.querySelectorAll('.search-item').forEach(item => {
            item.addEventListener('click', () => {
                const category = item.dataset.category;
                const key = item.dataset.key;
                this.switchCategory(category);
                this.highlightField(key);
            });
        });
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        this.searchQuery = '';
        const contentDiv = this.container.querySelector('#settings-content');
        contentDiv.innerHTML = this.renderCategoryContent(this.currentCategory);
        this.loadCategorySettings(this.currentCategory);
    }
    
    /**
     * Highlight field
     */
    highlightField(key) {
        setTimeout(() => {
            const field = this.container.querySelector(`[data-key="${key}"]`);
            if (field) {
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                field.classList.add('highlighted');
                setTimeout(() => field.classList.remove('highlighted'), 2000);
            }
        }, 100);
    }
    
    /**
     * Handle field change
     */
    handleFieldChange(field) {
        const category = field.dataset.category;
        const key = field.dataset.key;
        let value;
        
        if (field.type === 'checkbox') {
            value = field.checked;
        } else if (field.type === 'number') {
            value = parseFloat(field.value);
        } else {
            value = field.value;
        }
        
        // Update temporary settings
        this.updateTempSetting(category, key, value);
        this.markDirty();
    }
    
    /**
     * Handle array field change
     */
    handleArrayFieldChange(input) {
        const arrayField = input.closest('.array-field');
        const category = arrayField.dataset.category;
        const key = arrayField.dataset.key;
        const index = parseInt(input.dataset.index);
        
        // Get current array values
        const arrayItems = arrayField.querySelectorAll('.array-item input');
        const values = Array.from(arrayItems).map(item => item.value);
        
        this.updateTempSetting(category, key, values);
        this.markDirty();
    }
    
    /**
     * Add array item
     */
    addArrayItem(fieldId) {
        const arrayField = this.container.querySelector(`#${fieldId}`);
        const itemsContainer = arrayField.querySelector('.array-items');
        const newItem = document.createElement('div');
        newItem.className = 'array-item';
        newItem.innerHTML = `
            <input type="text" value="" data-index="${itemsContainer.children.length - 1}">
            <button class="btn btn-sm btn-danger" onclick="settingsPanel.removeArrayItem('${fieldId}', ${itemsContainer.children.length - 1})">
                ×
            </button>
        `;
        
        itemsContainer.insertBefore(newItem, itemsContainer.lastElementChild);
        this.handleArrayFieldChange(newItem.querySelector('input'));
    }
    
    /**
     * Remove array item
     */
    removeArrayItem(fieldId, index) {
        const arrayField = this.container.querySelector(`#${fieldId}`);
        const item = arrayField.querySelector(`.array-item input[data-index="${index}"]`).closest('.array-item');
        item.remove();
        
        // Reindex remaining items
        const items = arrayField.querySelectorAll('.array-item input');
        items.forEach((input, i) => {
            input.dataset.index = i;
        });
        
        this.handleArrayFieldChange(arrayField.querySelector('.array-item input'));
    }
    
    /**
     * Update temporary setting
     */
    updateTempSetting(category, key, value) {
        if (!this.tempSettings) {
            this.tempSettings = {};
        }
        
        if (!this.tempSettings[category]) {
            this.tempSettings[category] = {};
        }
        
        this.tempSettings[category][key] = value;
    }
    
    /**
     * Mark settings as dirty
     */
    markDirty() {
        this.isDirty = true;
        this.updateSaveButton(true);
        this.updateStatus('You have unsaved changes');
    }
    
    /**
     * Update save button visibility
     */
    updateSaveButton(show) {
        const saveBtn = this.container.querySelector('#save-settings');
        const applyBtn = this.container.querySelector('#apply-changes');
        const cancelBtn = this.container.querySelector('#cancel-changes');
        
        if (saveBtn) saveBtn.style.display = show ? 'block' : 'none';
        if (applyBtn) applyBtn.style.display = show ? 'block' : 'none';
        if (cancelBtn) cancelBtn.style.display = show ? 'block' : 'none';
    }
    
    /**
     * Update status message
     */
    updateStatus(message) {
        const statusElement = this.container.querySelector('#settings-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    /**
     * Load current settings
     */
    loadCurrentSettings() {
        for (const category of Object.keys(this.settingsManager.categories)) {
            this.loadCategorySettings(category);
        }
    }
    
    /**
     * Load category settings
     */
    loadCategorySettings(category) {
        const settings = this.settingsManager.getCategory(category);
        const schema = this.settingsManager.getSettingsSchema()[category];
        
        if (!schema) return;
        
        for (const [key, field] of Object.entries(schema.settings)) {
            const fieldId = `${category}-${key.replace(/\./g, '-')}`;
            const element = this.container.querySelector(`#${fieldId}`);
            
            if (element) {
                const value = this.settingsManager.get(category, key, field.default);
                this.setFieldValue(element, value, field);
            }
        }
    }
    
    /**
     * Set field value
     */
    setFieldValue(element, value, field) {
        if (element.type === 'checkbox') {
            element.checked = value;
        } else if (element.tagName === 'SELECT') {
            element.value = value;
        } else if (element.closest('.array-field')) {
            // Handle array fields
            const arrayField = element.closest('.array-field');
            arrayField.innerHTML = this.renderArrayField(value, element.id);
        } else {
            element.value = value || '';
        }
    }
    
    /**
     * Save settings
     */
    async saveSettings() {
        try {
            this.updateStatus('Saving settings...');
            
            if (this.tempSettings) {
                for (const [category, settings] of Object.entries(this.tempSettings)) {
                    await this.settingsManager.setCategory(category, settings);
                }
            }
            
            this.tempSettings = null;
            this.isDirty = false;
            this.updateSaveButton(false);
            this.updateStatus('Settings saved successfully');
            
            setTimeout(() => {
                this.updateStatus('All settings up to date');
            }, 3000);
            
        } catch (error) {
            console.error('[SettingsPanel] Failed to save settings:', error);
            this.updateStatus('Failed to save settings');
        }
    }
    
    /**
     * Cancel changes
     */
    cancelChanges() {
        this.tempSettings = null;
        this.isDirty = false;
        this.updateSaveButton(false);
        this.updateStatus('Changes cancelled');
        
        // Reload current settings
        this.loadCategorySettings(this.currentCategory);
        
        setTimeout(() => {
            this.updateStatus('All settings up to date');
        }, 2000);
    }
    
    /**
     * Reset all settings
     */
    async resetAllSettings() {
        if (!confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
            return;
        }
        
        try {
            await this.settingsManager.resetAll();
            this.tempSettings = null;
            this.isDirty = false;
            this.updateSaveButton(false);
            this.updateStatus('All settings reset to defaults');
            
            // Reload current view
            this.render();
            this.setupEventListeners();
            
            setTimeout(() => {
                this.updateStatus('All settings up to date');
            }, 3000);
            
        } catch (error) {
            console.error('[SettingsPanel] Failed to reset settings:', error);
            this.updateStatus('Failed to reset settings');
        }
    }
    
    /**
     * Export settings
     */
    exportSettings() {
        try {
            const settings = this.settingsManager.exportSettings();
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `nizhal-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.updateStatus('Settings exported successfully');
            
        } catch (error) {
            console.error('[SettingsPanel] Failed to export settings:', error);
            this.updateStatus('Failed to export settings');
        }
    }
    
    /**
     * Import settings
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const settings = JSON.parse(text);
                
                await this.settingsManager.importSettings(settings);
                this.tempSettings = null;
                this.isDirty = false;
                this.updateSaveButton(false);
                this.updateStatus('Settings imported successfully');
                
                // Reload current view
                this.render();
                this.setupEventListeners();
                
                setTimeout(() => {
                    this.updateStatus('All settings up to date');
                }, 3000);
                
            } catch (error) {
                console.error('[SettingsPanel] Failed to import settings:', error);
                this.updateStatus('Failed to import settings: Invalid file format');
            }
        };
        
        input.click();
    }
    
    /**
     * Show settings panel
     */
    show() {
        this.container.style.display = 'block';
        this.loadCurrentSettings();
    }
    
    /**
     * Hide settings panel
     */
    hide() {
        this.container.style.display = 'none';
    }
    
    /**
     * Toggle settings panel
     */
    toggle() {
        if (this.container.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }
}

// Make settingsPanel globally available for array field handlers
window.settingsPanel = null;

export default SettingsPanel;
