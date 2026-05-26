/**
 * content.js — Nizhal AI Content Script
 *
 * Runs on every page the user visits. Provides two capabilities:
 *  1. Extracts page context (title, URL, text content, meta description)
 *     when requested by the sidebar via the background worker.
 *  2. Remains lightweight — does NOT inject any UI or modify the DOM.
 *
 * Communication: listens for runtime messages with action = GET_PAGE_CONTEXT.
 */

const ACTION_GET_PAGE_CONTEXT = 'nizhal:get_page_context';

/**
 * Extract the meaningful text content from the page.
 * Strips scripts, styles, and invisible elements.
 * Truncates to a safe limit for AI processing.
 *
 * @param {number} maxChars - Maximum characters to extract (default 8000).
 * @returns {string} Cleaned page text.
 */
function extractPageText(maxChars = 8000) {
    try {
        // Clone the body to avoid mutating the live DOM
        const clone = document.body.cloneNode(true);

        // Remove elements that don't contain useful text
        const removeTags = ['script', 'style', 'noscript', 'svg', 'canvas', 'video', 'audio', 'iframe'];
        for (const tag of removeTags) {
            const elements = clone.querySelectorAll(tag);
            elements.forEach((el) => el.remove());
        }

        // Remove hidden elements
        const allElements = clone.querySelectorAll('*');
        allElements.forEach((el) => {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                el.remove();
            }
        });

        // Extract and clean text
        let text = clone.textContent || clone.innerText || '';
        text = text
            .replace(/\s+/g, ' ')         // Collapse whitespace
            .replace(/\n{3,}/g, '\n\n')    // Collapse excessive newlines
            .trim();

        return text.slice(0, maxChars);
    } catch (err) {
        console.error('[Nizhal Content] Text extraction failed:', err);
        return '';
    }
}

/**
 * Extract the page's meta description.
 * @returns {string} Meta description or empty string.
 */
function extractMetaDescription() {
    try {
        const meta =
            document.querySelector('meta[name="description"]') ||
            document.querySelector('meta[property="og:description"]');
        return meta?.content || '';
    } catch (err) {
        return '';
    }
}

/**
 * Build the full page context payload.
 * @returns {object} Page context object.
 */
function getPageContext() {
    return {
        url: window.location.href,
        title: document.title || '',
        description: extractMetaDescription(),
        text: extractPageText(),
        favicon: document.querySelector('link[rel="icon"]')?.href ||
                 document.querySelector('link[rel="shortcut icon"]')?.href || '',
        lang: document.documentElement.lang || '',
        timestamp: Date.now(),
    };
}

// ─── Message Listener ─────────────────────────────────────────────────

if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === ACTION_GET_PAGE_CONTEXT) {
            try {
                const context = getPageContext();
                sendResponse(context);
            } catch (err) {
                console.error('[Nizhal Content] Context extraction error:', err);
                sendResponse({
                    error: err.message,
                    url: window.location.href,
                    title: document.title,
                });
            }
        }
        // Return true for async sendResponse
        return true;
    });
}

console.log('[Nizhal Content] Content script loaded on', window.location.hostname);
