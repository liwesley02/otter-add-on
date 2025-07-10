#!/usr/bin/env node

/**
 * Build script to convert Chrome extension to Tampermonkey userscript
 * Usage: node build-userscript.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    extensionDir: '../otter-order-consolidator-v4',
    outputFile: 'otter-consolidator-bundle.user.js',
    version: '5.0.1',
    includes: [
        'https://app.tryotter.com/*',
        'https://tryotter.com/*'
    ],
    grants: [
        'GM_setValue',
        'GM_getValue',
        'GM_deleteValue',
        'GM_listValues',
        'GM_xmlhttpRequest',
        'GM_openInTab',
        'GM_addStyle',
        'GM_notification',
        'window.postMessage',
        'unsafeWindow'
    ],
    connects: [
        'localhost',
        'otter-api.hhg-ops.com',
        '*'
    ]
};

// File loading order (dependencies first)
const JS_FILES = [
    'utils/logger.js',
    'utils/storage.js',
    'utils/htmlEscape.js',
    'utils/categoryCache.js',
    'utils/apiClient.js',
    'components/prepTimeTracker.js',
    'components/itemMatcher.js',
    'components/categoryManager.js',
    'components/orderBatcher.js',
    'components/labelDataTransformer.js',
    'components/batchLabelPrinter.js',
    'components/batchManager.js',
    'content/orderCache.js',
    'content/networkMonitor.js',
    'content/orderExtractor.js',
    'content/reactDataExtractor.js',
    'content/pageContextExtractor.js',
    'content/authUI.js',
    'content/labelPreviewModal.js',
    'content/debugHelper.js',
    'content/overlay.js',
    'content/content.js'
];

const CSS_FILES = [
    'styles/overlay.css'
];

// UserScript header template
const HEADER_TEMPLATE = `// ==UserScript==
// @name         Otter Order Consolidator - Bundle
// @namespace    http://tampermonkey.net/
// @version      {{VERSION}}
// @description  Consolidated orders from Otter Dashboard - Auto-bundled from Chrome extension
// @author       HHG Team
{{MATCHES}}
// @icon         data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iIzAwNTVBNCIgc3Ryb2tlPSIjMDAzMzcwIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNOCAxNEgxMlYyNEg4VjE0WiIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMTQgMTBIMThWMjRIMTRWMTBaIiBmaWxsPSJ3aGl0ZSIvPgogIDxwYXRoIGQ9Ik0yMCA4SDI0VjI0SDIwVjhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=
{{GRANTS}}
{{CONNECTS}}
// @run-at       document-start
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // ===== Chrome API Polyfills =====
{{POLYFILLS}}

    // ===== Extension Code =====
{{CODE}}

    // ===== CSS Injection =====
{{STYLES}}

    // ===== Initialize =====
    console.log('[Otter Bundle] Initializing...');
    
    // Wait for DOM and initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        initializeExtension();
    }
})();`;

// Chrome API polyfills
const POLYFILLS = `
    // Storage polyfill
    const chrome = {
        storage: {
            local: {
                get: async (keys, callback) => {
                    if (typeof keys === 'string') keys = [keys];
                    const result = {};
                    for (const key of keys) {
                        const value = GM_getValue(key, null);
                        if (value !== null) {
                            result[key] = value;
                        }
                    }
                    if (callback) callback(result);
                    return result;
                },
                set: async (items, callback) => {
                    for (const [key, value] of Object.entries(items)) {
                        GM_setValue(key, value);
                    }
                    if (callback) callback();
                },
                remove: async (keys, callback) => {
                    if (typeof keys === 'string') keys = [keys];
                    for (const key of keys) {
                        GM_deleteValue(key);
                    }
                    if (callback) callback();
                }
            }
        },
        runtime: {
            sendMessage: (message, callback) => {
                // Simulate message handling
                if (message.action === 'getLeaderStatus') {
                    if (callback) callback({ isLeader: true });
                } else if (callback) {
                    callback({ success: true });
                }
            },
            onMessage: {
                addListener: () => {}
            },
            getURL: (path) => {
                if (path === 'label_printer.html') {
                    return 'data:text/html;base64,' + btoa(getLabelPrinterHTML());
                }
                return path;
            }
        },
        tabs: {
            create: (options) => {
                GM_openInTab(options.url, { active: options.active !== false });
            }
        }
    };

    // Override fetch for CORS
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
        if (url.includes('localhost') || url.includes('otter-api')) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: options?.method || 'GET',
                    url: url,
                    headers: options?.headers || {},
                    data: options?.body,
                    onload: (response) => {
                        resolve({
                            ok: response.status >= 200 && response.status < 300,
                            status: response.status,
                            json: () => Promise.resolve(JSON.parse(response.responseText)),
                            text: () => Promise.resolve(response.responseText)
                        });
                    },
                    onerror: reject
                });
            });
        }
        return originalFetch(url, options);
    };
`;

// Read and process files
function readFile(filePath) {
    try {
        return fs.readFileSync(path.join(CONFIG.extensionDir, filePath), 'utf8');
    } catch (error) {
        console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
        return '';
    }
}

function processJavaScript(code) {
    // Remove import/export statements
    code = code.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
    code = code.replace(/^export\s+(default\s+)?/gm, '');
    
    // Wrap in IIFE to avoid global pollution
    return `
    // ===== ${code.match(/\/\/ (.*)/)?.[1] || 'Module'} =====
    (function() {
        ${code}
    })();
    `;
}

function processCSS(css) {
    // Escape backticks and dollar signs for template literal
    css = css.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    
    return `
    GM_addStyle(\`
${css}
    \`);
    `;
}

function getLabelPrinterHTML() {
    const htmlPath = path.join(CONFIG.extensionDir, 'label_printer.html');
    try {
        return fs.readFileSync(htmlPath, 'utf8');
    } catch (error) {
        console.warn('Warning: Could not read label_printer.html');
        return '<html><body>Label Printer</body></html>';
    }
}

// Build the userscript
function build() {
    console.log('Building Tampermonkey userscript...');
    
    // Generate header sections
    const matches = CONFIG.includes.map(url => `// @match        ${url}`).join('\n');
    const grants = CONFIG.grants.map(grant => `// @grant        ${grant}`).join('\n');
    const connects = CONFIG.connects.map(domain => `// @connect      ${domain}`).join('\n');
    
    // Read and process JavaScript files
    let jsCode = '';
    for (const file of JS_FILES) {
        const code = readFile(file);
        if (code) {
            jsCode += processJavaScript(code) + '\n';
        }
    }
    
    // Read and process CSS files
    let cssCode = '';
    for (const file of CSS_FILES) {
        const css = readFile(file);
        if (css) {
            cssCode += processCSS(css) + '\n';
        }
    }
    
    // Add initialization code
    const initCode = `
    function initializeExtension() {
        console.log('[Otter Bundle] Extension initialized');
        
        // Initialize overlay if available
        if (typeof initializeOverlay === 'function') {
            initializeOverlay();
        }
        
        // Start content script if available
        if (typeof startContentScript === 'function') {
            startContentScript();
        }
    }
    
    function getLabelPrinterHTML() {
        return \`${getLabelPrinterHTML().replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
    }
    `;
    
    // Replace placeholders in template
    let output = HEADER_TEMPLATE
        .replace('{{VERSION}}', CONFIG.version)
        .replace('{{MATCHES}}', matches)
        .replace('{{GRANTS}}', grants)
        .replace('{{CONNECTS}}', connects)
        .replace('{{POLYFILLS}}', POLYFILLS)
        .replace('{{CODE}}', jsCode + initCode)
        .replace('{{STYLES}}', cssCode);
    
    // Write output file
    fs.writeFileSync(CONFIG.outputFile, output);
    console.log(`✓ Built ${CONFIG.outputFile} (${(output.length / 1024).toFixed(1)} KB)`);
    
    // Create minified version
    const minifiedOutput = output
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .replace(/\s{2,}/g, ' '); // Collapse multiple spaces
    
    const minifiedFile = CONFIG.outputFile.replace('.user.js', '.min.user.js');
    fs.writeFileSync(minifiedFile, minifiedOutput);
    console.log(`✓ Built ${minifiedFile} (${(minifiedOutput.length / 1024).toFixed(1)} KB)`);
}

// Run build
build();