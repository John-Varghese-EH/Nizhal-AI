/**
 * VoiceNotesService - Record and transcribe voice notes
 * 
 * Records audio notes with automatic transcription
 */

class VoiceNotesService {
    constructor() {
        this.notes = [];
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.initialized = false;
    }

    /**
     * Initialize the service
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.notes = stored;
            }
            this.initialized = true;
            console.log('[VoiceNotes] Initialized with', this.notes.length, 'notes');
        } catch (error) {
            console.error('[VoiceNotes] Init error:', error);
        }
    }

    /**
     * Start recording a voice note
     */
    async startRecording() {
        if (this.isRecording) {
            throw new Error('Already recording');
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            console.log('[VoiceNotes] Recording started');

            return true;
        } catch (error) {
            console.error('[VoiceNotes] Failed to start recording:', error);
            throw error;
        }
    }

    /**
     * Stop recording and save the note
     */
    async stopRecording(title = '') {
        if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('Not recording');
        }

        return new Promise((resolve, reject) => {
            this.mediaRecorder.onstop = async () => {
                try {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Get audio duration
                    const duration = await this._getAudioDuration(audioBlob);

                    const note = {
                        id: `note_${Date.now()}`,
                        title: title || `Note ${this.notes.length + 1}`,
                        audioUrl,
                        audioBlob: await this._blobToBase64(audioBlob),
                        duration,
                        timestamp: Date.now(),
                        date: new Date().toISOString(),
                        transcription: null
                    };

                    this.notes.unshift(note);
                    await this._saveToStorage();

                    // Stop tracks
                    if (this.stream) {
                        this.stream.getTracks().forEach(track => track.stop());
                    }

                    this.isRecording = false;
                    this.audioChunks = [];

                    console.log('[VoiceNotes] Recording saved:', note.id);
                    resolve(note);
                } catch (error) {
                    reject(error);
                }
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Cancel recording
     */
    cancelRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
        }
        this.isRecording = false;
        this.audioChunks = [];
    }

    /**
     * Get audio duration
     */
    async _getAudioDuration(blob) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(blob);
            audio.onloadedmetadata = () => {
                resolve(Math.round(audio.duration));
                URL.revokeObjectURL(audio.src);
            };
            audio.onerror = () => resolve(0);
        });
    }

    /**
     * Convert blob to base64
     */
    async _blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Get all notes
     */
    getNotes() {
        return [...this.notes];
    }

    /**
     * Get a specific note
     */
    getNote(id) {
        return this.notes.find(n => n.id === id);
    }

    /**
     * Delete a note
     */
    async deleteNote(id) {
        const index = this.notes.findIndex(n => n.id === id);
        if (index > -1) {
            this.notes.splice(index, 1);
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Update note transcription
     */
    async updateTranscription(id, transcription) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.transcription = transcription;
            await this._saveToStorage();
            return note;
        }
        return null;
    }

    /**
     * Play a note
     */
    playNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            const audio = new Audio(note.audioUrl || note.audioBlob);
            audio.play();
            return audio;
        }
        return null;
    }

    /**
     * Format duration as MM:SS
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Check if currently recording
     */
    getRecordingStatus() {
        return this.isRecording;
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.voiceNotes || [];
            }
            return [];
        } catch {
            return [];
        }
    }

    async _saveToStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                await window.nizhal.memory.setUserPreferences({
                    ...prefs,
                    voiceNotes: this.notes.slice(0, 50) // Keep last 50 notes
                });
            }
        } catch (error) {
            console.error('[VoiceNotes] Save error:', error);
        }
    }
}

export const voiceNotesService = new VoiceNotesService();
export default VoiceNotesService;
