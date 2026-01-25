/**
 * ChatHistoryService - Conversation History Management
 * 
 * Manages chat history with export capabilities
 */

class ChatHistoryService {
    constructor() {
        this.conversations = [];
        this.currentSession = [];
        this.sessionId = `session_${Date.now()}`;
    }

    /**
     * Add a message to current session
     */
    addMessage(role, content, metadata = {}) {
        const message = {
            id: Date.now(),
            role, // 'user' | 'assistant' | 'system'
            content,
            timestamp: new Date().toISOString(),
            ...metadata
        };

        this.currentSession.push(message);
        return message;
    }

    /**
     * Get current session messages
     */
    getCurrentSession() {
        return [...this.currentSession];
    }

    /**
     * Clear current session
     */
    clearCurrentSession() {
        // Archive current session before clearing
        if (this.currentSession.length > 0) {
            this.conversations.push({
                id: this.sessionId,
                messages: [...this.currentSession],
                startTime: this.currentSession[0]?.timestamp,
                endTime: this.currentSession[this.currentSession.length - 1]?.timestamp
            });
        }

        this.currentSession = [];
        this.sessionId = `session_${Date.now()}`;
    }

    /**
     * Get all conversations
     */
    getConversations() {
        return [...this.conversations];
    }

    /**
     * Export current session as JSON
     */
    exportAsJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            sessionId: this.sessionId,
            messageCount: this.currentSession.length,
            messages: this.currentSession
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Export current session as Markdown
     */
    exportAsMarkdown() {
        let md = `# Chat History\n\n`;
        md += `**Session:** ${this.sessionId}\n`;
        md += `**Exported:** ${new Date().toLocaleString()}\n`;
        md += `**Messages:** ${this.currentSession.length}\n\n`;
        md += `---\n\n`;

        for (const msg of this.currentSession) {
            const time = new Date(msg.timestamp).toLocaleTimeString();
            const roleIcon = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '⚙️';

            md += `### ${roleIcon} ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)} (${time})\n\n`;
            md += `${msg.content}\n\n`;
        }

        return md;
    }

    /**
     * Download export file
     */
    download(format = 'json') {
        const content = format === 'json' ? this.exportAsJSON() : this.exportAsMarkdown();
        const mimeType = format === 'json' ? 'application/json' : 'text/markdown';
        const extension = format === 'json' ? 'json' : 'md';
        const filename = `nizhal-chat-${new Date().toISOString().split('T')[0]}.${extension}`;

        // Create download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { filename, size: blob.size };
    }

    /**
     * Get history statistics
     */
    getStats() {
        const totalMessages = this.currentSession.length;
        const userMessages = this.currentSession.filter(m => m.role === 'user').length;
        const assistantMessages = this.currentSession.filter(m => m.role === 'assistant').length;

        return {
            totalMessages,
            userMessages,
            assistantMessages,
            conversations: this.conversations.length,
            sessionDuration: this.currentSession.length > 0
                ? Date.now() - new Date(this.currentSession[0].timestamp).getTime()
                : 0
        };
    }

    /**
     * Search through history
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.currentSession.filter(m =>
            m.content.toLowerCase().includes(lowerQuery)
        );
    }
}

export const chatHistoryService = new ChatHistoryService();
export default ChatHistoryService;
