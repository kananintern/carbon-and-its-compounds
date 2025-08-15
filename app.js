class MolecularExplorer {
    constructor() {
        this.viewer = null;
        this.currentSdf = null;
        this.currentCid = null;
        this.isLoading = false;
        this.currentHighlightedSuggestion = -1;
        
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            randomBtn: document.getElementById('randomBtn'),
            clearBtn: document.getElementById('clearBtn'),
            styleSelect: document.getElementById('styleSelect'),
            resetBtn: document.getElementById('resetBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            helpBtn: document.getElementById('helpBtn'),
            shareBtn: document.getElementById('shareBtn'),
            statusText: document.getElementById('statusText'),
            nameValue: document.getElementById('nameValue'),
            formulaValue: document.getElementById('formulaValue'),
            massValue: document.getElementById('massValue'),
            viewerOverlay: document.getElementById('viewerOverlay'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            toast: document.getElementById('toast'),
            suggestionsDropdown: document.getElementById('suggestionsDropdown')
        };

        this.sampleCompounds = [
            'caffeine', 'aspirin', 'glucose', 'ethanol', 'benzene', 
            'water', 'methane', 'penicillin', 'dopamine', 'serotonin',
            'morphine', 'nicotine', 'testosterone', 'cholesterol',
            'acetaminophen', 'ibuprofen', 'sucrose', 'fructose',
            'citric acid', 'acetic acid', 'formaldehyde', 'propane',
            'butane', 'toluene', 'phenol', 'aniline', 'pyridine'
        ];

        // Common compound synonyms for better search
        this.compoundSynonyms = {
            'paracetamol': 'acetaminophen',
            'tylenol': 'acetaminophen',
            'advil': 'ibuprofen',
            'motrin': 'ibuprofen',
            'sugar': 'sucrose',
            'table sugar': 'sucrose',
            'fruit sugar': 'fructose',
            'vinegar': 'acetic acid',
            'wood alcohol': 'methanol',
            'grain alcohol': 'ethanol',
            'rubbing alcohol': 'isopropanol',
            'vitamin c': 'ascorbic acid',
            'baking soda': 'sodium bicarbonate',
            'salt': 'sodium chloride'
        };

        this.colorScheme = {
            C: '#808080', H: '#ffffff', O: '#ff0000', N: '#0000ff',
            S: '#ffff00', P: '#ffa500', CL: '#00ff00', F: '#90ee90', BR: '#a52a2a'
        };

        this.init();
    }

    init() {
        this.initViewer();
        this.bindEvents();
        this.updateStatus('Ready to explore molecules');
    }

    initViewer() {
        try {
            this.viewer = $3Dmol.createViewer('viewer', {
                backgroundColor: '#f8fafc'
            });
        } catch (error) {
            console.error('Failed to initialize 3Dmol viewer:', error);
            this.showToast('Failed to initialize 3D viewer', 'error');
        }
    }

    bindEvents() {
        // Search functionality
        this.elements.searchBtn.addEventListener('click', () => this.search());
        this.elements.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (this.currentHighlightedSuggestion >= 0) {
                    this.selectSuggestion(this.currentHighlightedSuggestion);
                } else {
                    this.search();
                }
                this.hideSuggestions();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateSuggestions(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSuggestions(-1);
            } else if (e.key === 'Escape') {
                this.hideSuggestions();
            }
        });

        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        this.elements.searchInput.addEventListener('blur', () => {
            // Delay hiding suggestions to allow clicking
            setTimeout(() => this.hideSuggestions(), 150);
        });

        this.elements.randomBtn.addEventListener('click', () => this.searchRandom());
        this.elements.clearBtn.addEventListener('click', () => this.clear());

        // Viewer controls
        this.elements.styleSelect.addEventListener('change', () => this.updateStyle());
        this.elements.resetBtn.addEventListener('click', () => this.resetView());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadSdf());
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Utility buttons
        this.elements.helpBtn.addEventListener('click', () => this.showHelp());
        this.elements.shareBtn.addEventListener('click', () => this.shareUrl());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '/':
                        e.preventDefault();
                        this.elements.searchInput.focus();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetView();
                        break;
                }
            }
        });

        // Click outside to hide suggestions
        document.addEventListener('click', (e) => {
            if (!this.elements.searchInput.contains(e.target) && 
                !this.elements.suggestionsDropdown.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    // Search input handling with suggestions
    handleSearchInput(value) {
        const trimmedValue = value.trim().toLowerCase();
        
        if (trimmedValue.length < 2) {
            this.hideSuggestions();
            return;
        }

        const suggestions = this.generateSuggestions(trimmedValue);
        this.showSuggestions(suggestions);
    }

    generateSuggestions(input) {
        const suggestions = [];
        const maxSuggestions = 5;

        // Check compound synonyms first
        for (const [synonym, canonical] of Object.entries(this.compoundSynonyms)) {
            if (synonym.includes(input) && suggestions.length < maxSuggestions) {
                suggestions.push({
                    text: canonical,
                    highlight: synonym,
                    type: 'synonym'
                });
            }
        }

        // Then check sample compounds
        for (const compound of this.sampleCompounds) {
            if (compound.toLowerCase().includes(input) && suggestions.length < maxSuggestions) {
                // Avoid duplicates
                if (!suggestions.find(s => s.text === compound)) {
                    suggestions.push({
                        text: compound,
                        highlight: compound,
                        type: 'compound'
                    });
                }
            }
        }

        // Add fuzzy matches for common misspellings
        if (suggestions.length < maxSuggestions) {
            const fuzzyMatches = this.getFuzzyMatches(input);
            fuzzyMatches.forEach(match => {
                if (suggestions.length < maxSuggestions && 
                    !suggestions.find(s => s.text === match)) {
                    suggestions.push({
                        text: match,
                        highlight: match,
                        type: 'fuzzy'
                    });
                }
            });
        }

        return suggestions;
    }

    getFuzzyMatches(input) {
        const fuzzyMatches = [];
        const threshold = 2; // Maximum edit distance

        for (const compound of this.sampleCompounds) {
            const distance = this.levenshteinDistance(input, compound.toLowerCase());
            if (distance <= threshold && distance > 0) {
                fuzzyMatches.push(compound);
            }
        }

        // Sort by edit distance (closer matches first)
        return fuzzyMatches.sort((a, b) => 
            this.levenshteinDistance(input, a.toLowerCase()) - 
            this.levenshteinDistance(input, b.toLowerCase())
        );
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    showSuggestions(suggestions) {
        const dropdown = this.elements.suggestionsDropdown;
        dropdown.innerHTML = '';

        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion.text;
            
            // Add type indicator
            if (suggestion.type === 'synonym') {
                item.innerHTML = `${suggestion.text} <small style="color: var(--text-light);">(${suggestion.highlight})</small>`;
            }

            item.addEventListener('click', () => {
                this.selectSuggestion(index);
                this.hideSuggestions();
            });

            dropdown.appendChild(item);
        });

        dropdown.classList.add('show');
        this.currentHighlightedSuggestion = -1;
    }

    hideSuggestions() {
        this.elements.suggestionsDropdown.classList.remove('show');
        this.currentHighlightedSuggestion = -1;
    }

    navigateSuggestions(direction) {
        const suggestions = this.elements.suggestionsDropdown.querySelectorAll('.suggestion-item');
        if (suggestions.length === 0) return;

        // Remove current highlight
        if (this.currentHighlightedSuggestion >= 0) {
            suggestions[this.currentHighlightedSuggestion].classList.remove('highlighted');
        }

        // Update index
        this.currentHighlightedSuggestion += direction;

        // Handle bounds
        if (this.currentHighlightedSuggestion < -1) {
            this.currentHighlightedSuggestion = suggestions.length - 1;
        } else if (this.currentHighlightedSuggestion >= suggestions.length) {
            this.currentHighlightedSuggestion = -1;
        }

        // Add new highlight
        if (this.currentHighlightedSuggestion >= 0) {
            suggestions[this.currentHighlightedSuggestion].classList.add('highlighted');
        }
    }

    selectSuggestion(index) {
        const suggestions = this.elements.suggestionsDropdown.querySelectorAll('.suggestion-item');
        if (index >= 0 && index < suggestions.length) {
            const suggestionText = suggestions[index].textContent.split('(')[0].trim();
            this.elements.searchInput.value = suggestionText;
            this.search();
        }
    }

    async search() {
        const query = this.elements.searchInput.value.trim();
        if (!query || this.isLoading) return;

        this.hideSuggestions();
        this.isLoading = true;
        this.showLoading(true);
        this.showViewerOverlay(true);

        try {
            await this.loadCompound(query);
        } catch (error) {
            console.error('Search failed:', error);
            this.showToast(error.message || 'Search failed', 'error');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
            this.showViewerOverlay(false);
        }
    }

    searchRandom() {
        const randomCompound = this.sampleCompounds[Math.floor(Math.random() * this.sampleCompounds.length)];
        this.elements.searchInput.value = randomCompound;
        this.search();
    }

    async loadCompound(query) {
        this.updateStatus('Searching PubChem...');

        // Check if it's a synonym
        const canonicalName = this.compoundSynonyms[query.toLowerCase()] || query;

        // Determine if query is CID or name
        const isCID = /^\d+$/.test(canonicalName);
        let cid;

        if (isCID) {
            cid = canonicalName;
        } else {
            // Get CID from compound name
            const response = await this.fetchWithTimeout(
                `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(canonicalName)}/cids/JSON`,
                15000
            );
            
            if (!response.ok) {
                throw new Error(`Compound "${query}" not found. Try checking the spelling or use a different name.`);
            }
            
            const data = await response.json();
            if (!data?.IdentifierList?.CID?.length) {
                throw new Error(`No results found for "${query}". Please check the spelling or try a synonym.`);
            }
            
            cid = data.IdentifierList.CID[0];
        }

        this.currentCid = cid;
        this.updateStatus(`Loading properties...`);

        // Fetch compound properties and synonyms
        const [propsResponse, synonymsResponse] = await Promise.all([
            this.fetchWithTimeout(
                `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`,
                15000
            ),
            this.fetchWithTimeout(
                `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`,
                15000
            ).catch(() => null) // Don't fail if synonyms aren't available
        ]);

        if (!propsResponse.ok) {
            throw new Error('Failed to fetch compound properties');
        }

        const propsData = await propsResponse.json();
        const props = propsData?.PropertyTable?.Properties?.[0] || {};

        // Get synonyms for common names
        let synonyms = [];
        if (synonymsResponse && synonymsResponse.ok) {
            try {
                const synonymsData = await synonymsResponse.json();
                synonyms = synonymsData?.InformationList?.[0]?.Synonym || [];
            } catch (e) {
                console.warn('Failed to parse synonyms');
            }
        }

        // Update compound info display
        this.updateCompoundInfo(props, synonyms, query);

        this.updateStatus(`Loading 3D structure...`);

        // Try to fetch 3D SDF
        let sdfText;
        try {
            const sdf3dResponse = await this.fetchWithTimeout(
                `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF/?record_type=3d`,
                20000
            );
            
            if (!sdf3dResponse.ok) throw new Error('No 3D structure');
            
            sdfText = await sdf3dResponse.text();
            if (!sdfText || sdfText.trim().length < 50) {
                throw new Error('Empty 3D structure');
            }
        } catch (error) {
            // Fallback to 2D structure
            this.showToast('3D coordinates unavailable, using 2D structure', 'warning');
            const sdf2dResponse = await this.fetchWithTimeout(
                `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`,
                20000
            );
            
            if (!sdf2dResponse.ok) {
                throw new Error('No molecular structure available');
            }
            
            sdfText = await sdf2dResponse.text();
        }

        this.currentSdf = sdfText;
        this.renderMolecule(sdfText);
        
        // Get display name
        const displayName = this.getDisplayName(synonyms, props.IUPACName, query);
        this.updateStatus(`Loaded: ${displayName}`);
        this.showToast(`Successfully loaded ${displayName}`, 'success');
    }

    getDisplayName(synonyms, iupacName, originalQuery) {
        // Find the best common name from synonyms
        const commonNames = synonyms.filter(name => 
            name.length < 50 && // Not too long
            !name.includes('UNII-') && // Not a registry number
            !name.match(/^\d+/) && // Not starting with numbers
            !name.includes('CHEMBL') && // Not a ChEMBL ID
            !name.includes('ZINC') && // Not a ZINC ID
            name.toLowerCase() !== iupacName?.toLowerCase() // Not the same as IUPAC
        ).sort((a, b) => a.length - b.length); // Prefer shorter names

        return commonNames.length > 0 ? commonNames[0] : (iupacName || originalQuery);
    }

    async fetchWithTimeout(url, timeout = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    }

    updateCompoundInfo(props, synonyms, originalQuery) {
        // Get the best names to display
        const commonNames = synonyms.filter(name => 
            name.length < 50 && 
            !name.includes('UNII-') && 
            !name.match(/^\d+/) && 
            !name.includes('CHEMBL') &&
            !name.includes('ZINC')
        ).sort((a, b) => a.length - b.length);

        const commonName = commonNames.length > 0 ? commonNames[0] : originalQuery;
        const iupacName = props.IUPACName;

        // Create name display
        let nameDisplay = '';
        if (commonName && iupacName && commonName.toLowerCase() !== iupacName.toLowerCase()) {
            nameDisplay = `
                <div class="common-name">${commonName}</div>
                <div class="iupac-name">${iupacName}</div>
            `;
        } else {
            nameDisplay = `<div class="common-name">${commonName || iupacName || originalQuery}</div>`;
        }

        this.elements.nameValue.innerHTML = nameDisplay;
        this.elements.formulaValue.textContent = props.MolecularFormula || '—';
        this.elements.massValue.textContent = props.MolecularWeight 
            ? `${parseFloat(props.MolecularWeight).toFixed(3)} g/mol` 
            : '—';
    }

    renderMolecule(sdfText) {
        if (!this.viewer) {
            this.initViewer();
        }

        this.viewer.clear();
        
        try {
            this.viewer.addModel(sdfText, 'sdf');
            this.updateStyle();
            this.viewer.zoomTo();
            this.viewer.render();
        } catch (error) {
            console.error('Failed to render molecule:', error);
            throw new Error('Failed to render molecular structure');
        }
    }

    updateStyle() {
        if (!this.viewer) return;

        const style = this.elements.styleSelect.value;

        const atomColorFn = (atom) => {
            const element = (atom.elem || '').toUpperCase();
            return this.colorScheme[element] || '#cccccc';
        };

        this.viewer.setStyle({}, {});

        switch (style) {
            case 'stick':
                this.viewer.setStyle({}, {
                    stick: { radius: 0.15, colorscheme: atomColorFn }
                });
                break;
            case 'ballstick':
                this.viewer.setStyle({}, {
                    stick: { radius: 0.12, colorscheme: atomColorFn },
                    sphere: { scale: 0.25, colorscheme: atomColorFn }
                });
                break;
            case 'sphere':
                this.viewer.setStyle({}, {
                    sphere: { scale: 0.4, colorscheme: atomColorFn }
                });
                break;
            case 'wire':
                this.viewer.setStyle({}, {
                    line: { linewidth: 2, colorscheme: atomColorFn }
                });
                break;
        }

        this.viewer.render();
    }

    resetView() {
        if (!this.viewer) return;
        
        try {
            this.viewer.zoomTo();
            this.viewer.rotate(0, { x: 1, y: 0, z: 0 });
            this.viewer.rotate(0, { x: 0, y: 1, z: 0 });
            this.viewer.render();
            this.showToast('View reset', 'success');
        } catch (error) {
            console.error('Failed to reset view:', error);
        }
    }

    downloadSdf() {
        if (!this.currentSdf) {
            this.showToast('No molecule loaded to download', 'error');
            return;
        }

        const blob = new Blob([this.currentSdf], {
            type: 'chemical/x-mdl-sdfile'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.elements.nameValue.textContent.split('\n')[0] || 'compound'}.sdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('SDF file downloaded', 'success');
    }

    toggleFullscreen() {
        const viewerCard = document.querySelector('.viewer-card');
        
        if (!document.fullscreenElement) {
            viewerCard.requestFullscreen().then(() => {
                this.elements.fullscreenBtn.textContent = '🔲 Exit Fullscreen';
                this.showToast('Entered fullscreen mode', 'success');
            }).catch(err => {
                console.error('Failed to enter fullscreen:', err);
                this.showToast('Fullscreen not supported', 'error');
            });
        } else {
            document.exitFullscreen().then(() => {
                this.elements.fullscreenBtn.textContent = '⛶ Fullscreen';
                this.showToast('Exited fullscreen mode', 'success');
            });
        }
    }

    shareUrl() {
        if (!this.currentCid) {
            this.showToast('No compound loaded to share', 'error');
            return;
        }

        const url = `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(this.elements.searchInput.value)}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Molecular Structure',
                text: `Check out this molecular structure: ${this.elements.nameValue.textContent}`,
                url: url
            }).then(() => {
                this.showToast('Shared successfully', 'success');
            }).catch(err => {
                console.error('Share failed:', err);
                this.copyToClipboard(url);
            });
        } else {
            this.copyToClipboard(url);
        }
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('URL copied to clipboard', 'success');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showToast('Failed to copy URL', 'error');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.showToast('URL copied to clipboard', 'success');
            } catch (err) {
                this.showToast('Failed to copy URL', 'error');
            }
            document.body.removeChild(textArea);
        }
    }

    showHelp() {
        const helpText = `🧬 Molecular Explorer Help

🔍 Search:
• Enter compound names (e.g., "caffeine", "aspirin")
• Spelling suggestions appear automatically
• Use arrow keys to navigate suggestions
• Try common names like "sugar" or "salt"
• Press Enter or click Search

🎮 Controls:
• Mouse: Click and drag to rotate
• Scroll: Zoom in/out
• Style dropdown: Change visualization
• Reset: Return to original view
• Fullscreen: Immersive viewing

⌨️ Keyboard Shortcuts:
• Ctrl+/ : Focus search box
• Ctrl+R : Reset view
• Arrow keys: Navigate suggestions
• Escape: Hide suggestions

🎨 Visualization Styles:
• Ball & Stick: Best for structure
• Stick: Clean bond representation
• Space-filling: Shows molecular volume
• Wireframe: Minimal representation

💡 Tips:
• Download SDF files for other software
• Share molecules with the share button
• Try different visualization styles
• Use synonyms (e.g., "tylenol" for acetaminophen)`;

        alert(helpText);
    }

    clear() {
        this.elements.searchInput.value = '';
        this.elements.searchInput.focus();
        this.hideSuggestions();
        
        if (this.viewer) {
            this.viewer.clear();
            this.viewer.render();
        }
        
        this.currentSdf = null;
        this.currentCid = null;
        
        this.elements.nameValue.innerHTML = '—';
        this.elements.formulaValue.textContent = '—';
        this.elements.massValue.textContent = '—';
        
        this.updateStatus('Ready to explore molecules');
    }

    updateStatus(message) {
        this.elements.statusText.textContent = message;
    }

    showLoading(show) {
        this.elements.loadingOverlay.classList.toggle('show', show);
    }

    showViewerOverlay(show) {
        this.elements.viewerOverlay.classList.toggle('show', show);
    }

    showToast(message, type = 'info') {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        // Auto-hide after different durations based on type
        const hideTimeout = type === 'info' ? 2000 : 4000;
        setTimeout(() => {
            toast.classList.remove('show');
        }, hideTimeout);
    }

    // Initialize URL parameters
    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search');
        
        if (search) {
            this.elements.searchInput.value = search;
            this.search();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const explorer = new MolecularExplorer();
    explorer.checkUrlParams();
    
    // Global reference for debugging
    window.molecularExplorer = explorer;
});