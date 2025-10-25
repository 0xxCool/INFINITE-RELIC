import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI integration enabled');
    } else {
      this.logger.warn('OpenAI API key not found - AI features disabled');
    }
  }

  /**
   * Generate a friendly welcome message for new users
   */
  async generateWelcomeMessage(userName: string): Promise<string> {
    if (!this.openai) {
      return this.getDefaultWelcomeMessage(userName);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a friendly and enthusiastic assistant for Infinite Relic, a DeFi protocol that lets users:
- Lock USDC to earn real-world asset (RWA) yield from US T-Bills
- Get 5-17% APR depending on lock period (30-365 days)
- Receive tradeable NFTs representing their locked positions
- Claim yield anytime

Keep messages concise (2-3 sentences), welcoming, and excited. Use 1-2 emojis max.`
          },
          {
            role: 'user',
            content: `Generate a welcome message for a new user named ${userName}`
          }
        ],
        max_tokens: 150,
        temperature: 0.9
      });

      return completion.choices[0]?.message?.content || this.getDefaultWelcomeMessage(userName);
    } catch (error) {
      this.logger.error('Failed to generate welcome message:', error);
      return this.getDefaultWelcomeMessage(userName);
    }
  }

  /**
   * Generate a quest completion congratulations message
   */
  async generateQuestCompleteMessage(questType: string, reward: number): Promise<string> {
    if (!this.openai) {
      return this.getDefaultQuestMessage(questType, reward);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are celebrating a user's quest completion. Be enthusiastic and encouraging. Keep it to 1-2 sentences with 1-2 emojis.`
          },
          {
            role: 'user',
            content: `User completed quest: ${questType} and earned $${reward}. Generate a congratulations message.`
          }
        ],
        max_tokens: 100,
        temperature: 0.9
      });

      return completion.choices[0]?.message?.content || this.getDefaultQuestMessage(questType, reward);
    } catch (error) {
      this.logger.error('Failed to generate quest message:', error);
      return this.getDefaultQuestMessage(questType, reward);
    }
  }

  /**
   * Generate a personalized yield claim message
   */
  async generateYieldClaimMessage(amount: number, totalEarned: number): Promise<string> {
    if (!this.openai) {
      return this.getDefaultYieldMessage(amount, totalEarned);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You're congratulating a user on earning yield from real-world assets. Be excited about passive income. 1-2 sentences, 1-2 emojis.`
          },
          {
            role: 'user',
            content: `User just claimed $${amount.toFixed(2)} yield. Total earned: $${totalEarned.toFixed(2)}`
          }
        ],
        max_tokens: 100,
        temperature: 0.9
      });

      return completion.choices[0]?.message?.content || this.getDefaultYieldMessage(amount, totalEarned);
    } catch (error) {
      this.logger.error('Failed to generate yield message:', error);
      return this.getDefaultYieldMessage(amount, totalEarned);
    }
  }

  /**
   * Answer user questions about the protocol
   */
  async answerQuestion(question: string): Promise<string> {
    if (!this.openai) {
      return "I'm currently unable to answer questions. Please check our docs at https://infiniterelic.xyz or ask in our Telegram group!";
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for Infinite Relic protocol. Answer questions about:

**Protocol Basics:**
- Users lock USDC and receive an NFT representing their position
- Locked USDC is invested in RWA (Real-World Assets) - specifically Ondo Finance's OUSG (US T-Bills)
- Users earn 5-17% APR depending on lock period
- Yield can be claimed anytime, even before unlock
- NFTs are tradeable on OpenSea

**Lock Periods & APR:**
- 30 days: Copper Relic, 5-7% APR
- 90 days: Silver Relic, 5-10% APR
- 180 days: Gold Relic, 5-13% APR
- 365 days: Infinite Relic, 5-17% APR

**Fees:**
- 1% dev fee on deposit
- 10% performance fee on yield above 15% APR
- No withdrawal fees

**Technical:**
- Built on Arbitrum (low gas fees)
- Audited smart contracts
- ERC-721 NFTs for positions
- Integration with Ondo Finance OUSG

Keep answers concise (2-4 sentences), friendly, and accurate. Use 1-2 emojis max.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || "I couldn't process your question. Please try rephrasing or check our docs!";
    } catch (error) {
      this.logger.error('Failed to answer question:', error);
      return "Sorry, I'm having trouble right now. Please check our docs at https://infiniterelic.xyz or ask in our community!";
    }
  }

  /**
   * Generate daily quest notification message
   */
  async generateDailyQuestMessage(): Promise<string> {
    if (!this.openai) {
      return '🎁 Daily Quest Available! Open the app to complete it and earn rewards.';
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate a short, exciting message to notify users about their daily quest. 1 sentence, 1-2 emojis.`
          },
          {
            role: 'user',
            content: 'Create a daily quest notification message'
          }
        ],
        max_tokens: 50,
        temperature: 0.95
      });

      return completion.choices[0]?.message?.content || '🎁 Daily Quest Available! Open the app to complete it and earn rewards.';
    } catch (error) {
      this.logger.error('Failed to generate daily quest message:', error);
      return '🎁 Daily Quest Available! Open the app to complete it and earn rewards.';
    }
  }

  // Fallback messages when OpenAI is not available
  private getDefaultWelcomeMessage(userName: string): string {
    return `Welcome to Infinite Relic, ${userName}! 🔮\n\nLock USDC, earn 5-17% APR from real-world assets, and get a tradeable NFT. Ready to start earning?`;
  }

  private getDefaultQuestMessage(questType: string, reward: number): string {
    return `🎉 Quest Complete!\n\nYou earned $${reward.toFixed(2)} for completing ${questType}. Keep it up!`;
  }

  private getDefaultYieldMessage(amount: number, totalEarned: number): string {
    return `💰 Yield Claimed!\n\nYou just earned $${amount.toFixed(2)}! Total earned: $${totalEarned.toFixed(2)}`;
  }
}
