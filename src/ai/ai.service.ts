import { Injectable } from '@nestjs/common';
import { ModelMessage, streamText } from 'ai';
import { createOllama, OllamaProvider } from 'ollama-ai-provider-v2';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { featureContexts } from './ai.context';
import { AnthropicProvider, createAnthropic } from '@ai-sdk/anthropic';
import { AIConfigService } from 'src/config/services/ai.config.service';

@Injectable()
export class AIService {
    private readonly provider: OllamaProvider | AnthropicProvider;

    constructor(
        private readonly aiConfig: AIConfigService,
        private readonly serverConfig: ServerConfigService,
    ) {
        this.provider = this.serverConfig.isProduction
            ? createAnthropic({
                  apiKey: this.aiConfig.aiProviderToken,
              })
            : createOllama({
                  baseURL: this.aiConfig.aiProviderToken,
              });
    }

    provideContext(messageContent: string): Record<string, any> {
        const query = messageContent.toLowerCase();
        const matched = featureContexts.find((bucket) =>
            bucket.keywords.some((keyword) => query.includes(keyword)),
        );
        return matched ? matched.context : {};
    }

    getChatStream(messages: ModelMessage[]): ReturnType<typeof streamText> {
        const context = this.provideContext(<string>messages[messages.length - 1].content);
        const result = streamText({
            model: this.provider(this.aiConfig.provider),
            messages: messages,
            system: `
            You are a GraphQL API assistant for the RateWise platform.
            Your job is to explain which GraphQL operations developers should use.

            STRICT RULES:
            - ONLY use information explicitly provided in the context.
            - NEVER invent UI flows, buttons, pages, settings, menus, emails, phone numbers, or support links.
            - NEVER invent GraphQL operations.
            - NEVER assume frontend behavior.
            - If information is missing, say: "The provided context does not specify this."
            - Keep answers concise and technical.
            - Focus on:
              - operation purpose
              - authentication requirements
              - side effects
              - constraints
              - rate limits
              - possible errors

            Relevant context:
            ${JSON.stringify(context)}`,
        });
        return result;
    }
}
