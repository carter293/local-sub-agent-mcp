import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { fileURLToPath } from 'url';
import { createFileSystemTools } from '../tools/fileSystemTools';
import { openai } from '@ai-sdk/openai';

const __filename = fileURLToPath(import.meta.url);

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

    const response = await generateText({
      model: openai('gpt-4.1'),
      // model: google('gemini-2.5-pro'),
      system: systemPromptText,
      prompt: query,
      tools: this.tools,
      maxSteps: 100
    });
    console.error(`[DEBUG] Response: ${JSON.stringify(response)}`);
    return response.text;
  }
}
