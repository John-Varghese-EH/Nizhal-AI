import { toPng } from 'html-to-image';
import { clipboard } from 'electron';

/**
 * SharingService - Handles viral content generation
 */
export class SharingService {
    constructor() {
        this.isSharing = false;
    }

    /**
     * capturing the ShareCard node and converting to PNG
     * @param {HTMLElement} node 
     */
    async generateShareImage(node) {
        if (!node) return null;
        try {
            const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
            return dataUrl;
        } catch (error) {
            console.error('Error generating share image:', error);
            return null;
        }
    }

    /**
     * Copy image to clipboard for easy pasting into X/Discord
     */
    async copyToClipboard(dataUrl) {
        try {
            const img = nativeImage.createFromDataURL(dataUrl);
            clipboard.writeImage(img);
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Fallback for renderer process if nativeImage is main-only (it is)
            // We usually need to send this to main process to handle clipboard writImage correctly 
            // if we are in renderer.
            // But let's assume we use the standard navigator.clipboard API if possible, 
            // though it takes Blob.

            return false;
        }
    }

    // Helper to trigger download
    downloadImage(dataUrl, filename = 'my-nizhal.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }
}

export const sharingService = new SharingService();
