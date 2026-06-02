import Anthropic from '@anthropic-ai/sdk';
import { truncate } from './runtime.js';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type Tool = {
  name: string;
  description: string;
  input_schema: Anthropic.Tool['input_schema'];
  handler: (input: Record<string, unknown>) => Promise<string>;
};

export async function runAgentLoop(params: {
  model: string;
  system: string;
  messages: Anthropic.MessageParam[];
  tools: Tool[];
  maxIterations?: number;
  maxTokens?: number;
  maxToolResultChars?: number;
}): Promise<string> {
  const { model, system, tools, maxIterations = 30, maxTokens = 4096, maxToolResultChars = 20_000 } = params;
  const messages: Anthropic.MessageParam[] = [...params.messages];

  const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  for (let i = 0; i < maxIterations; i++) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages,
      tools: anthropicTools.length > 0 ? anthropicTools : undefined,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        const tool = tools.find((t) => t.name === block.name);
        if (!tool) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: unknown tool "${block.name}"`,
            is_error: true,
          });
          continue;
        }

        try {
          const result = await tool.handler(block.input as Record<string, unknown>);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: truncate(result, maxToolResultChars) });
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: 'user', content: toolResults });
    }
  }

  throw new Error(`Agent loop reached ${maxIterations} iterations without finishing`);
}
