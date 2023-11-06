import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from "openai-edge";
import { OpenAIStream } from "ai";

export type AIMessage = ChatCompletionRequestMessage;

export async function getChatCompletionResponse(
  env: Record<string, any>,
  chain: ChatCompletionRequestMessage[],
  onStartCallback: () => void,
  onTokenCallback: (token: string) => void
) {
  const openai = new OpenAIApi(
    new Configuration({
      organization: env.OPENAI_API_ORGANIZATION,
      apiKey: env.OPENAI_API_KEY,
      basePath: env.OPENAI_API_BASE_PATH,
    })
  );

  const prompt = chain.map((message) => {
    return { role: message.role, content: message.content };
  });

  const openaiResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: prompt,
  });

  const stream = OpenAIStream(openaiResponse, {
    onStart: async () => onStartCallback(),
    onToken: async (token) => onTokenCallback(token),
  });

  // @ts-ignore
  for await (const _ of stream) {
    // no-op, just read the stream, onToken callback above will handle the tokens
  }

  return null;
}
