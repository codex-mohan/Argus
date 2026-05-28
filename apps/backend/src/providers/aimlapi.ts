import type {
  Context,
  Model,
  Provider,
  StreamOptions,
} from "@mohanscodex/spectra-ai";
import {
  AssistantMessageEventStream,
  registerProvider,
} from "@mohanscodex/spectra-ai";

export function registerAimlApiProvider(): void {
  const provider: Provider = {
    name: "aimlapi",
    stream(
      model: Model,
      context: Context,
      options?: StreamOptions
    ): AssistantMessageEventStream {
      const stream = new AssistantMessageEventStream();

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: provider implementation follows Spectra Code pattern
      const run = async () => {
        try {
          const apiKey = options?.apiKey ?? process.env.AIMLAPI_KEY;
          if (!apiKey) {
            throw new Error("AIMLAPI_KEY not set");
          }

          const { default: OpenAI } = await import("openai");
          const client = new OpenAI({
            apiKey,
            baseURL: "https://api.aimlapi.com/v1",
          });

          const messages: Record<string, unknown>[] = [];
          if (context.systemPrompt) {
            messages.push({ role: "system", content: context.systemPrompt });
          }
          for (const msg of context.messages) {
            if (msg.role === "user") {
              const content =
                typeof msg.content === "string"
                  ? msg.content
                  : (msg.content as Array<{ type: string; text?: string }>).map(
                      (c) =>
                        c.type === "text" ? { type: "text", text: c.text } : c
                    );
              messages.push({ role: "user", content });
            } else if (msg.role === "assistant") {
              const blocks = msg.content as Array<{
                type: string;
                text?: string;
                id?: string;
                name?: string;
                arguments?: Record<string, unknown>;
              }>;
              const text = blocks
                .filter((b) => b.type === "text")
                .map((b) => b.text ?? "")
                .join("");
              const toolCalls = blocks
                .filter((b) => b.type === "toolCall")
                .map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: {
                    name: tc.name,
                    arguments: JSON.stringify(tc.arguments ?? {}),
                  },
                }));
              messages.push({
                role: "assistant",
                content: text || undefined,
                tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
              });
            } else if (msg.role === "toolResult") {
              const text = (
                msg.content as Array<{ type: string; text?: string }>
              )
                .filter((c) => c.type === "text")
                .map((c) => c.text ?? "")
                .join("\n");
              messages.push({
                role: "tool",
                content: text || "(no result)",
                tool_call_id: msg.toolCallId,
              });
            }
          }

          const params: Record<string, unknown> = {
            model: model.id,
            messages,
            stream: true,
            stream_options: { include_usage: true },
          };
          if (options?.maxTokens) {
            params.max_completion_tokens = options.maxTokens;
          }
          if (options?.temperature !== undefined) {
            params.temperature = options.temperature;
          }
          if (context.tools?.length) {
            params.tools = context.tools.map((t) => ({
              type: "function",
              function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              },
            }));
          }

          const openaiStream = (await client.chat.completions.create(
            params as Record<string, unknown>,
            { signal: options?.signal }
          )) as unknown as AsyncIterable<Record<string, unknown>>;

          const output: Record<string, unknown> = {
            role: "assistant",
            content: [],
            model: model.id,
          };
          stream.push({
            type: "start",
            partial: output as Parameters<
              AssistantMessageEventStream["push"]
            >[0] & { partial: unknown },
          });

          let currentBlock: Record<string, unknown> | null = null;
          const blocks = output.content as Record<string, unknown>[];
          const blockIdx = () => blocks.length - 1;

          for await (const chunk of openaiStream) {
            if (!chunk || typeof chunk !== "object") {
              continue;
            }
            const choice = (
              Array.isArray((chunk as { choices?: unknown[] }).choices)
                ? (chunk as { choices: unknown[] }).choices[0]
                : undefined
            ) as Record<string, unknown> | undefined;
            if (!choice) {
              continue;
            }

            const delta = choice.delta as Record<string, unknown> | undefined;
            const finish = choice.finish_reason as string | undefined;

            if (delta?.content && String(delta.content).length > 0) {
              if (!currentBlock || currentBlock.type !== "text") {
                currentBlock = { type: "text", text: "" };
                blocks.push(currentBlock);
                stream.push({
                  type: "text_start",
                  contentIndex: blockIdx(),
                  partial: output as Parameters<
                    AssistantMessageEventStream["push"]
                  >[0] & { partial: unknown },
                });
              }
              (currentBlock as { text: string }).text += String(delta.content);
              stream.push({
                type: "text_delta",
                contentIndex: blockIdx(),
                delta: String(delta.content),
                partial: output as Parameters<
                  AssistantMessageEventStream["push"]
                >[0] & { partial: unknown },
              });
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls as Array<{
                id?: string;
                index?: number;
                function?: { name?: string; arguments?: string };
              }>) {
                if (
                  !currentBlock ||
                  currentBlock.type !== "toolCall" ||
                  (tc.id && (currentBlock as { id: string }).id !== tc.id)
                ) {
                  currentBlock = {
                    type: "toolCall",
                    id: tc.id ?? "",
                    name: tc.function?.name ?? "",
                    arguments: {},
                    partialArgs: "",
                  };
                  blocks.push(currentBlock);
                  stream.push({
                    type: "toolcall_start",
                    contentIndex: blockIdx(),
                    partial: output as Parameters<
                      AssistantMessageEventStream["push"]
                    >[0] & { partial: unknown },
                  });
                }
                if (tc.id) {
                  (currentBlock as { id: string }).id = tc.id;
                }
                if (tc.function?.name) {
                  (currentBlock as { name: string }).name = tc.function.name;
                }
                if (tc.function?.arguments) {
                  (currentBlock as { partialArgs: string }).partialArgs +=
                    tc.function.arguments;
                  try {
                    (currentBlock as { arguments: unknown }).arguments =
                      JSON.parse(
                        (currentBlock as { partialArgs: string }).partialArgs
                      );
                  } catch {
                    /* partial */
                  }
                }
              }
            }

            if (finish) {
              stream.push({
                type: "done",
                reason: finish === "stop" ? "stop" : "length",
                message: output as Parameters<
                  AssistantMessageEventStream["push"]
                >[0] & { message: unknown },
              });
              stream.end();
            }
          }
        } catch (err) {
          stream.push({
            type: "error",
            reason: "error",
            error: {
              errorMessage: err instanceof Error ? err.message : String(err),
            } as Parameters<AssistantMessageEventStream["push"]>[0] & {
              error: unknown;
            },
          });
          stream.end();
        }
      };

      run();
      return stream;
    },
  };

  registerProvider(provider);
  console.log(
    "[provider] AI/ML API registered — base: https://api.aimlapi.com/v1"
  );
}
