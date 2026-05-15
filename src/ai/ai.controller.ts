import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AIService } from './ai.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ModelMessage } from 'ai';
import { Response } from 'express';

type ChatMessage = {
    parts: [{ type: string; text: string }];
    role: 'assistant' | 'user';
};

@Controller('ai')
export class AIController {
    constructor(private readonly aiService: AIService) {}

    @Public()
    @Post('chat')
    @HttpCode(HttpStatus.OK)
    handleChat(@Body('messages') messages: ChatMessage[], @Res() res: Response): void {
        const formattedUserMessages: ModelMessage[] = messages.map((message) => {
            const content = message.parts.map((part) => part.text).join('');
            return { role: message.role, content };
        });
        const result = this.aiService.getChatStream(formattedUserMessages);
        result.pipeUIMessageStreamToResponse(res);
    }
}
