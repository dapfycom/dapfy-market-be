import { Injectable } from '@nestjs/common';
import { Groq } from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';

@Injectable()
export class GroqService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async chatCompletion(
    userMessage: string,
    systemMessage?: string,
  ): Promise<string> {
    try {
      const messages = [
        {
          role: 'user',
          content: userMessage,
        },
      ];

      if (systemMessage) {
        messages.unshift({
          role: 'system',
          content: systemMessage,
        });
      }

      const chatCompletion = await this.client.chat.completions.create({
        messages: messages as ChatCompletionMessageParam[],
        model: 'llama3-70b-8192',
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      return chatCompletion.choices[0]?.message?.content ?? '';
    } catch (error) {
      console.error('Error in Groq chat completion:', error);

      throw new Error('Failed to get chat completion from Groq');
    }
  }
}
