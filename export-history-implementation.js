// Export and History System Implementation for Genshi Studio

// ===== History System =====
class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 100;
        this.db = null;
        this.thumbnailSize = 64;
        this.autoSaveInterval = 30000; // 30 seconds
        this.initDB();
        this.startAutoSave();
    }

    async initDB() {
        const request = indexedDB.open('GenshiStudioDB', 1);
        
        request.onerror = () => console.error('Failed to open IndexedDB');
        
        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.loadSession();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('history')) {
                db.createObjectStore('history', { keyPath: 'timestamp' });
            }
            if (!db.objectStoreNames.contains('sessions')) {
                db.createObjectStore('sessions', { keyPath: 'id' });
            }
        };
    }

    saveState(state, description = '') {
        const timestamp = Date.now();
        const snapshot = {
            timestamp,
            state: JSON.parse(JSON.stringify(state)),
            description,
            thumbnail: this.generateThumbnail()
        };

        // Remove future history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new state
        this.history.push(snapshot);
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        // Save to IndexedDB
        this.saveToIndexedDB(snapshot);
        
        // Update UI
        this.updateHistoryUI();
    }

    generateThumbnail() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.thumbnailSize;
        tempCanvas.height = this.thumbnailSize;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Scale down the main canvas
        const mainCanvas = document.getElementById('patternCanvas');
        tempCtx.drawImage(mainCanvas, 0, 0, this.thumbnailSize, this.thumbnailSize);
        
        return tempCanvas.toDataURL('image/jpeg', 0.7);
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.restoreState(this.history[this.currentIndex].state);
            this.updateHistoryUI();
        }
    }

    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.restoreState(this.history[this.currentIndex].state);
            this.updateHistoryUI();
        }
    }

    restoreState(state) {
        // Deep copy state to avoid reference issues
        const restoredState = JSON.parse(JSON.stringify(state));
        
        // Restore app state
        appState.parameters = restoredState.parameters;
        appState.currentPattern = restoredState.currentPattern;
        appState.patterns = restoredState.patterns;
        
        // Update UI
        updateUIValues();
        updateColorPickers();
        update2DControl();
        selectPattern(appState.currentPattern);
    }

    saveToIndexedDB(snapshot) {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        store.add(snapshot);
    }

    async loadSession() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const savedHistory = event.target.result;
            if (savedHistory && savedHistory.length > 0) {
                // Load last 50 states
                this.history = savedHistory.slice(-50);
                this.currentIndex = this.history.length - 1;
                this.updateHistoryUI();
            }
        };
    }

    startAutoSave() {
        setInterval(() => {
            if (appState.isAnimating) {
                this.saveState(appState, 'Auto-save');
            }
        }, this.autoSaveInterval);
    }

    updateHistoryUI() {
        const timeline = document.getElementById('historyTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';
        
        this.history.forEach((snapshot, index) => {
            const item = document.createElement('div');
            item.className = `history-item ${index === this.currentIndex ? 'active' : ''}`;
            item.onclick = () => this.jumpToState(index);
            
            const img = document.createElement('img');
            img.src = snapshot.thumbnail;
            img.alt = snapshot.description;
            
            const time = document.createElement('div');
            time.className = 'history-time';
            time.textContent = new Date(snapshot.timestamp).toLocaleTimeString();
            
            item.appendChild(img);
            item.appendChild(time);
            timeline.appendChild(item);
        });

        // Scroll to current position
        if (timeline.children[this.currentIndex]) {
            timeline.children[this.currentIndex].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest', 
                inline: 'center' 
            });
        }
    }

    jumpToState(index) {
        if (index >= 0 && index < this.history.length) {
            this.currentIndex = index;
            this.restoreState(this.history[index].state);
            this.updateHistoryUI();
        }
    }
}

// ===== Export System =====
class ExportManager {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingStartTime = 0;
        this.recordingDuration = 5000; // 5 seconds default
        this.gifWorker = null;
        this.initGifWorker();
    }

    initGifWorker() {
        // Note: In production, you'd load gif.js library
        // This is a placeholder for the implementation
    }

    async exportPNG(resolution = 'HD') {
        const canvas = document.getElementById('patternCanvas');
        const resolutions = {
            'HD': { width: 1920, height: 1080 },
            '4K': { width: 3840, height: 2160 },
            'Square': { width: 2048, height: 2048 },
            'Current': { width: canvas.width, height: canvas.height }
        };

        const { width, height } = resolutions[resolution] || resolutions['HD'];
        
        // Create temporary canvas at desired resolution
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Store current canvas state
        const currentWidth = appState.canvasWidth;
        const currentHeight = appState.canvasHeight;
        
        // Temporarily resize for export
        appState.canvasWidth = width;
        appState.canvasHeight = height;
        
        // Render current frame at new resolution
        tempCtx.fillStyle = '#000';
        tempCtx.fillRect(0, 0, width, height);
        
        // Re-render current pattern at high resolution
        const currentRenderer = patternRenderers[appState.currentPattern];
        if (currentRenderer) {
            // Save current context state
            const savedCtx = ctx;
            ctx = tempCtx;
            
            // Render pattern
            currentRenderer();
            
            // Restore context
            ctx = savedCtx;
        }
        
        // Restore original dimensions
        appState.canvasWidth = currentWidth;
        appState.canvasHeight = currentHeight;
        
        // Convert to blob and download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `genshi_${appState.currentPattern}_${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    async startVideoRecording(duration = 5) {
        if (this.isRecording) return;
        
        const canvas = document.getElementById('patternCanvas');
        const stream = canvas.captureStream(30); // 30 FPS
        
        this.recordedChunks = [];
        this.recordingDuration = duration * 1000;
        this.isRecording = true;
        
        // Show recording indicator
        this.showRecordingIndicator();
        
        const options = {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 5000000 // 5 Mbps
        };
        
        this.mediaRecorder = new MediaRecorder(stream, options);
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `genshi_${appState.currentPattern}_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.hideRecordingIndicator();
            this.isRecording = false;
        };
        
        this.mediaRecorder.start();
        this.recordingStartTime = Date.now();
        
        // Auto-stop after duration
        setTimeout(() => {
            if (this.isRecording) {
                this.stopVideoRecording();
            }
        }, this.recordingDuration);
    }

    stopVideoRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
        }
    }

    async exportGIF(duration = 5) {
        const canvas = document.getElementById('patternCanvas');
        const fps = 15;
        const frames = duration * fps;
        const frameDelay = 1000 / fps;
        
        // Show progress indicator
        this.showExportProgress('Generating GIF...', 0);
        
        // Create GIF encoder (using gif.js library in production)
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: canvas.width,
            height: canvas.height
        });
        
        // Capture frames
        for (let i = 0; i < frames; i++) {
            await new Promise(resolve => setTimeout(resolve, frameDelay));
            gif.addFrame(canvas, { copy: true, delay: frameDelay });
            this.updateExportProgress((i + 1) / frames);
        }
        
        gif.on('finished', (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `genshi_${appState.currentPattern}_${Date.now()}.gif`;
            a.click();
            URL.revokeObjectURL(url);
            this.hideExportProgress();
        });
        
        gif.render();
    }

    exportSVG() {
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', appState.canvasWidth);
        svg.setAttribute('height', appState.canvasHeight);
        svg.setAttribute('viewBox', `0 0 ${appState.canvasWidth} ${appState.canvasHeight}`);
        svg.style.backgroundColor = '#000';
        
        // Add pattern-specific SVG generation
        const pattern = appState.currentPattern;
        
        if (pattern === 'truchet' || pattern === 'maze') {
            // These patterns can be converted to SVG paths
            this.generateSVGPaths(svg, pattern);
        } else {
            // For other patterns, create a rasterized version
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            const canvas = document.getElementById('patternCanvas');
            image.setAttribute('href', canvas.toDataURL());
            image.setAttribute('width', appState.canvasWidth);
            image.setAttribute('height', appState.canvasHeight);
            svg.appendChild(image);
        }
        
        // Convert to blob and download
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `genshi_${appState.currentPattern}_${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    generateSVGPaths(svg, pattern) {
        // Pattern-specific SVG generation
        // This would need to be implemented based on each pattern's logic
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('stroke', appState.parameters.colors.primary);
        g.setAttribute('stroke-width', appState.parameters.lineWeight);
        g.setAttribute('fill', 'none');
        
        // Add paths based on pattern data
        // ... pattern-specific implementation
        
        svg.appendChild(g);
    }

    async batchExport(formats = ['PNG', 'GIF'], variations = 3) {
        this.showExportProgress('Batch exporting...', 0);
        
        const originalState = JSON.parse(JSON.stringify(appState));
        let exported = 0;
        const total = formats.length * variations;
        
        for (let v = 0; v < variations; v++) {
            // Create variation
            randomizePattern();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            for (const format of formats) {
                switch (format) {
                    case 'PNG':
                        await this.exportPNG('HD');
                        break;
                    case 'GIF':
                        await this.exportGIF(3); // 3 second GIFs for batch
                        break;
                    case 'SVG':
                        this.exportSVG();
                        break;
                }
                
                exported++;
                this.updateExportProgress(exported / total);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Restore original state
        appState.parameters = originalState.parameters;
        appState.patterns = originalState.patterns;
        selectPattern(originalState.currentPattern);
        updateUIValues();
        updateColorPickers();
        
        this.hideExportProgress();
    }

    showRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'recordingIndicator';
        indicator.className = 'recording-indicator';
        indicator.innerHTML = `
            <div class="recording-dot"></div>
            <span>Recording...</span>
            <span id="recordingTime">0:00</span>
        `;
        document.body.appendChild(indicator);
        
        // Update timer
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            document.getElementById('recordingTime').textContent = 
                `${minutes}:${secs.toString().padStart(2, '0')}`;
        }, 100);
    }

    hideRecordingIndicator() {
        clearInterval(this.recordingTimer);
        const indicator = document.getElementById('recordingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showExportProgress(message, progress) {
        let progressBar = document.getElementById('exportProgress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'exportProgress';
            progressBar.className = 'export-progress';
            progressBar.innerHTML = `
                <div class="export-progress-message">${message}</div>
                <div class="export-progress-bar">
                    <div class="export-progress-fill" style="width: 0%"></div>
                </div>
            `;
            document.body.appendChild(progressBar);
        }
        
        const fill = progressBar.querySelector('.export-progress-fill');
        fill.style.width = `${progress * 100}%`;
    }

    updateExportProgress(progress) {
        const progressBar = document.getElementById('exportProgress');
        if (progressBar) {
            const fill = progressBar.querySelector('.export-progress-fill');
            fill.style.width = `${progress * 100}%`;
        }
    }

    hideExportProgress() {
        const progressBar = document.getElementById('exportProgress');
        if (progressBar) {
            progressBar.remove();
        }
    }
}

// Initialize managers
let historyManager;
let exportManager;

// Add to initializeApp function
function initializeExportAndHistory() {
    historyManager = new HistoryManager();
    exportManager = new ExportManager();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        historyManager.redo();
                    } else {
                        historyManager.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    historyManager.redo();
                    break;
                case 's':
                    e.preventDefault();
                    exportManager.exportPNG('HD');
                    break;
                case 'e':
                    if (e.shiftKey) {
                        e.preventDefault();
                        showExportMenu();
                    }
                    break;
            }
        }
    });
    
    // Save state on parameter changes
    const originalUpdateUIValues = window.updateUIValues;
    window.updateUIValues = function() {
        originalUpdateUIValues();
        if (historyManager) {
            historyManager.saveState(appState, 'Parameter change');
        }
    };
}

// Export menu UI
function showExportMenu() {
    const menu = document.createElement('div');
    menu.id = 'exportMenu';
    menu.className = 'export-menu';
    menu.innerHTML = `
        <div class="export-menu-content">
            <h3>Export Options</h3>
            <div class="export-options">
                <div class="export-section">
                    <h4>Image Export</h4>
                    <button class="export-btn" onclick="exportManager.exportPNG('HD')">
                        📸 PNG (HD)
                    </button>
                    <button class="export-btn" onclick="exportManager.exportPNG('4K')">
                        📸 PNG (4K)
                    </button>
                    <button class="export-btn" onclick="exportManager.exportPNG('Square')">
                        📸 PNG (Square)
                    </button>
                    <button class="export-btn" onclick="exportManager.exportSVG()">
                        📐 SVG Vector
                    </button>
                </div>
                <div class="export-section">
                    <h4>Video Export</h4>
                    <button class="export-btn" onclick="exportManager.startVideoRecording(5)">
                        🎬 Record 5s
                    </button>
                    <button class="export-btn" onclick="exportManager.startVideoRecording(10)">
                        🎬 Record 10s
                    </button>
                    <button class="export-btn" onclick="exportManager.startVideoRecording(30)">
                        🎬 Record 30s
                    </button>
                    <button class="export-btn" onclick="exportManager.exportGIF(5)">
                        🎞️ GIF (5s)
                    </button>
                </div>
                <div class="export-section">
                    <h4>Batch Export</h4>
                    <button class="export-btn" onclick="exportManager.batchExport(['PNG'], 5)">
                        📦 5 PNG Variations
                    </button>
                    <button class="export-btn" onclick="exportManager.batchExport(['PNG', 'GIF'], 3)">
                        📦 3 Sets (PNG + GIF)
                    </button>
                </div>
            </div>
            <button class="export-close" onclick="closeExportMenu()">Close</button>
        </div>
    `;
    document.body.appendChild(menu);
}

function closeExportMenu() {
    const menu = document.getElementById('exportMenu');
    if (menu) {
        menu.remove();
    }
}

// CSS Styles for Export and History
const exportHistoryStyles = `
/* Export Button */
.export-btn-main {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
}

.export-btn-main:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* History Timeline */
.history-timeline {
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 8px;
    display: flex;
    gap: 8px;
    max-width: 80%;
    overflow-x: auto;
    z-index: 1000;
    -webkit-overflow-scrolling: touch;
}

.history-item {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.history-item:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.3);
}

.history-item.active {
    border-color: #4ECDC4;
    box-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
}

.history-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.history-time {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    font-size: 9px;
    text-align: center;
    padding: 2px;
}

/* Recording Indicator */
.recording-indicator {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 1001;
    animation: pulse 1.5s ease-in-out infinite;
}

.recording-dot {
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

@keyframes pulse {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.05); }
}

/* Export Progress */
.export-progress {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px;
    min-width: 300px;
    z-index: 1002;
}

.export-progress-message {
    color: white;
    margin-bottom: 12px;
    text-align: center;
}

.export-progress-bar {
    background: rgba(255, 255, 255, 0.1);
    height: 4px;
    border-radius: 2px;
    overflow: hidden;
}

.export-progress-fill {
    background: linear-gradient(90deg, #4ECDC4, #45B7D1);
    height: 100%;
    transition: width 0.3s ease;
}

/* Export Menu */
.export-menu {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1003;
}

.export-menu-content {
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 32px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.export-menu h3 {
    color: white;
    margin-bottom: 24px;
    text-align: center;
    font-size: 24px;
}

.export-menu h4 {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 12px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.export-options {
    display: grid;
    gap: 24px;
}

.export-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
}

.export-btn {
    display: block;
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    padding: 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
}

.export-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(4px);
}

.export-close {
    display: block;
    margin: 24px auto 0;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    padding: 12px 32px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.export-close:hover {
    background: rgba(255, 255, 255, 0.2);
}
`;

// Add styles to document
const styleElement = document.createElement('style');
styleElement.textContent = exportHistoryStyles;
document.head.appendChild(styleElement);