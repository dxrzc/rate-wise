import { Injectable } from '@nestjs/common';
import { ModelMessage, streamText } from 'ai';
import { createOllama, OllamaProvider } from 'ollama-ai-provider-v2';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { featureContexts } from './ai.context';

@Injectable()
export class AIService {
    // TODO: claude provider
    private readonly provider: OllamaProvider;

    constructor(private readonly serverConfig: ServerConfigService) {
        this.provider = createOllama({
            baseURL: this.serverConfig.aiProviderToken,
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
            model: this.provider('llama3.2:3b'),
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
