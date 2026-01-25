import { CreateMLCEngine } from "@mlc-ai/web-llm";

/**
 * WebLLMService - Manages local LLM inference in the browser
 */
class WebLLMService {
    constructor() {
        this.engine = null;
        this.isLoading = false;
        this.modelId = "Llama-3.2-3B-Instruct-q4f16_1-MLC"; // Good balance of speed/quality
        // Backup: "Phi-3.5-mini-instruct-q4f16_1-MLC"

        this.initProgressCallback = null;
    }

    /**
     * Initialize the local engine
     * @param {Function} onProgress - (progress) => void
     */
    async initialize(onProgress) {
        if (this.engine) return;

        this.isLoading = true;
        this.initProgressCallback = onProgress;

        try {
            console.log("Initializing WebLLM...");
            this.engine = await CreateMLCEngine(
                this.modelId,
                {
                    initProgressCallback: (report) => {
                        console.log("WebLLM Progress:", report.text);
                        if (this.initProgressCallback) {
                            this.initProgressCallback(report);
                        }
                    }
                }
            );
            console.log("WebLLM Ready!");
        } catch (error) {
            console.error("Failed to initialize WebLLM:", error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Stream chat completion
     * @param {Array} messages - Chat history
     * @param {Function} onUpdate - (chunk) => void
     */
    async chat(messages, onUpdate) {
        if (!this.engine) {
            throw new Error("Engine not initialized");
        }

        try {
            const chunks = await this.engine.chat.completions.create({
                messages,
                stream: true,
                temperature: 0.7,
                max_tokens: 256, // Keep responses concise for voice
            });

            let fullResponse = "";
            for await (const chunk of chunks) {
                const delta = chunk.choices[0]?.delta.content || "";
                fullResponse += delta;
                if (onUpdate) onUpdate(delta);
            }

            return fullResponse;
        } catch (error) {
            console.error("WebLLM Inference Error:", error);
            return "I had trouble thinking... bit rot maybe?";
        }
    }

    /**
     * One-shot completion
     */
    async complete(messages) {
        if (!this.engine) throw new Error("Engine not initialized");

        const reply = await this.engine.chat.completions.create({
            messages,
            temperature: 0.7,
        });

        return reply.choices[0].message.content;
    }

    /**
     * Check if loaded
     */
    isReady() {
        return !!this.engine;
    }
}

export const webLLMService = new WebLLMService();
