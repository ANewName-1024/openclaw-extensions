/**
 * SessionMemory - Automatic conversation summarization
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { DEFAULT_MEMORY_CONFIG, DEFAULT_SESSION_MEMORY_TEMPLATE } from '../types/index.js';
// =============================================================================
// Session Memory Manager
// =============================================================================
export class SessionMemoryManager {
    config;
    state;
    sessionDir;
    sessionFile;
    extractionAgent;
    constructor(config = {}, sessionDir = './.session-memory', extractionAgent) {
        this.config = { ...DEFAULT_MEMORY_CONFIG.sessionMemory, ...config };
        this.sessionDir = sessionDir;
        this.sessionFile = path.join(sessionDir, 'current.md');
        this.extractionAgent = extractionAgent;
        this.state = {
            initialized: false,
            lastExtractionTokens: 0,
            lastExtractionMessageId: null,
            extractionCount: 0,
        };
    }
    // ===========================================================================
    // Configuration
    // ===========================================================================
    getConfig() {
        return this.config;
    }
    getState() {
        return { ...this.state };
    }
    reset() {
        this.state = {
            initialized: false,
            lastExtractionTokens: 0,
            lastExtractionMessageId: null,
            extractionCount: 0,
        };
    }
    // ===========================================================================
    // Extraction Decision
    // ===========================================================================
    /**
     * Check if memory extraction should be triggered
     */
    shouldExtract(messages) {
        if (!this.config.enabled) {
            return false;
        }
        const tokenCount = this.estimateTokens(messages);
        // Check initialization threshold
        if (!this.state.initialized) {
            if (tokenCount < this.config.minimumMessageTokensToInit) {
                return false;
            }
            this.state.initialized = true;
        }
        // Check token growth threshold (required)
        const tokenGrowth = tokenCount - this.state.lastExtractionTokens;
        const hasMetTokenThreshold = tokenGrowth >= this.config.minimumTokensBetweenUpdate;
        if (!hasMetTokenThreshold) {
            return false;
        }
        // Check tool call threshold
        const toolCallsSinceLast = this.countToolCallsSince(messages, this.state.lastExtractionMessageId);
        const hasMetToolCallThreshold = toolCallsSinceLast >= this.config.toolCallsBetweenUpdates;
        // Check if last turn has tool calls (avoid truncating)
        const lastTurnClean = !this.lastTurnHasToolCalls(messages);
        // Trigger conditions:
        // 1. Token threshold + tool call threshold both met
        // 2. Token threshold met + natural conversation break (no tool calls in last turn)
        return ((hasMetTokenThreshold && hasMetToolCallThreshold) ||
            (hasMetTokenThreshold && lastTurnClean));
    }
    // ===========================================================================
    // Extraction
    // ===========================================================================
    /**
     * Extract and save session memory
     */
    async extract(messages) {
        if (!this.shouldExtract(messages)) {
            throw new Error('Extraction threshold not met');
        }
        // Mark extraction started
        this.markExtractionStarted();
        // Ensure session file exists
        await this.ensureSessionFile();
        // Read current memory
        const currentMemory = await this.readCurrentMemory();
        // Build extraction prompt
        const prompt = this.buildExtractionPrompt(currentMemory, messages);
        // Run extraction
        let summary;
        if (this.extractionAgent) {
            summary = await this.extractionAgent.extract(prompt, this.sessionFile);
        }
        else {
            // Fallback: just return the prompt
            summary = prompt;
        }
        // Save summary
        await this.saveSummary(summary);
        // Update state
        this.state.lastExtractionTokens = this.estimateTokens(messages);
        const lastMessage = messages.at(-1);
        if (lastMessage?.id) {
            this.state.lastExtractionMessageId = lastMessage.id;
        }
        return summary;
    }
    /**
     * Manually trigger extraction (for /summary command)
     */
    async extractManual(messages) {
        if (messages.length === 0) {
            return { success: false, error: 'No messages to summarize' };
        }
        try {
            await this.ensureSessionFile();
            const currentMemory = await this.readCurrentMemory();
            const prompt = this.buildExtractionPrompt(currentMemory, messages);
            let summary;
            if (this.extractionAgent) {
                summary = await this.extractionAgent.extract(prompt, this.sessionFile);
            }
            else {
                summary = prompt;
            }
            await this.saveSummary(summary);
            return { success: true, path: this.sessionFile };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    // ===========================================================================
    // Private Methods
    // ===========================================================================
    async ensureSessionFile() {
        await fs.mkdir(this.sessionDir, { recursive: true });
        try {
            await fs.writeFile(this.sessionFile, '', { flag: 'wx' });
            // Write template
            const template = this.loadTemplate();
            await fs.writeFile(this.sessionFile, template);
        }
        catch (e) {
            if (e.code !== 'EEXIST') {
                throw e;
            }
        }
    }
    loadTemplate() {
        return this.config.template
            ? this.serializeTemplate(this.config.template)
            : DEFAULT_SESSION_MEMORY_TEMPLATE;
    }
    serializeTemplate(template) {
        return `---
name: current-session
description: Current conversation summary
type: session
---

# ${template.title}
_${'A short and distinctive 5-10 word descriptive title for the session.'}_

# ${template.currentState}
_${'What is actively being worked on right now?'}_

# ${template.taskSpecification}
_${'What did the user ask to build?'}_

# ${template.filesAndFunctions}
_${'What are the important files?'}_

# ${template.workflow}
_${'What bash commands are usually run?'}_

# ${template.errorsAndCorrections}
_${'Errors encountered and how they were fixed?'}_

# ${template.learnings}
_${'What has worked well? What has not?'}_

# ${template.keyResults}
_${'If the user asked a specific output, repeat it here.'}_

# ${template.worklog}
_${'Step by step, what was attempted and done?'}_
`;
    }
    async readCurrentMemory() {
        try {
            return await fs.readFile(this.sessionFile, 'utf-8');
        }
        catch {
            return '';
        }
    }
    async saveSummary(summary) {
        await fs.writeFile(this.sessionFile, summary, 'utf-8');
    }
    buildExtractionPrompt(currentMemory, messages) {
        const recentMessages = messages.slice(-20); // Last 20 messages
        const formattedMessages = recentMessages
            .map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : '[content]'}`)
            .join('\n\n');
        return `
Based on the user conversation below, update the session notes file at ${this.sessionFile}.

Current notes:
${currentMemory || '(empty)'}

Recent conversation:
${formattedMessages}

Please update the session notes with:
1. Key topics discussed
2. Important decisions made
3. Action items or follow-ups
4. Any relevant context that should be remembered

Keep the notes concise and actionable. Update every section as needed.
`;
    }
    markExtractionStarted() {
        this.state.extractionCount++;
    }
    estimateTokens(messages) {
        // Rough estimation: 4 characters per token
        const totalChars = messages.reduce((sum, m) => {
            const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
            return sum + content.length;
        }, 0);
        return Math.ceil(totalChars / 4);
    }
    countToolCallsSince(messages, sinceId) {
        if (!sinceId) {
            // Count all tool calls
            return messages.reduce((count, m) => {
                if (m.role === 'assistant' && m.tool_calls) {
                    return count + m.tool_calls.length;
                }
                return count;
            }, 0);
        }
        let foundStart = false;
        let toolCallCount = 0;
        for (const message of messages) {
            if (!foundStart) {
                if (message.id === sinceId) {
                    foundStart = true;
                }
                continue;
            }
            if (message.role === 'assistant' && message.tool_calls) {
                toolCallCount += message.tool_calls.length;
            }
        }
        return toolCallCount;
    }
    lastTurnHasToolCalls(messages) {
        const lastMessage = messages.at(-1);
        return lastMessage?.role === 'assistant' &&
            Array.isArray(lastMessage.tool_calls) &&
            lastMessage.tool_calls.length > 0;
    }
}
// =============================================================================
// Factory
// =============================================================================
export function createSessionMemoryManager(config, sessionDir, extractionAgent) {
    return new SessionMemoryManager(config, sessionDir, extractionAgent);
}
export default SessionMemoryManager;
//# sourceMappingURL=SessionMemory.js.map