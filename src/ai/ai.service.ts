import { Injectable } from '@nestjs/common';
import { ModelMessage, streamText } from 'ai';
import { createOllama, OllamaProvider } from 'ollama-ai-provider-v2';
import { ServerConfigService } from 'src/config/services/server.config.service';

@Injectable()
export class AIService {
    // TODO: claude provider
    private readonly provider: OllamaProvider;

    constructor(private readonly serverConfig: ServerConfigService) {
        this.provider = createOllama({
            baseURL: this.serverConfig.aiProviderToken,
        });
    }

    getChatStream(messages: ModelMessage[]): ReturnType<typeof streamText> {
        const result = streamText({
            model: this.provider('llama3.2:3b'),
            messages: messages,
        });
        return result;
    }
}
