import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFileSystemTools } from '../tools/fileSystemTools.js';
import { openai } from '@ai-sdk/openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export abstract class AbstractAgent {
  protected projectPath: string;
  protected abstract systemPrompt: string;
  private tools: ReturnType<typeof createFileSystemTools>;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.tools = createFileSystemTools(this.projectPath);
  }

  private async loadPrompt(): Promise<string> {
    // Prompts are now hardcoded in each agent class
    return this.getSystemPrompt();
  }

  protected abstract getSystemPrompt(): string;

  public async run(query: string): Promise<string> {
    const systemPromptText = await this.loadPrompt();

    const { text } = await generateText({
      model: openai('gpt-4.1'),
      // model: google('gemini-2.5-pro'),
      system: systemPromptText,
      prompt: query,
      tools: this.tools,
      maxSteps: 10
    });

    return text;
  }
}
