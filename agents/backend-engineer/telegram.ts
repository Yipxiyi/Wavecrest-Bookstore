/**
 * Telegram Bot Integration for Backend Engineer Agent
 * Sends notifications about sync status, errors, and summaries
 */

import { CONFIG } from './config';

export class TelegramNotifier {
  private botToken: string;
  private chatId?: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID;
  }

  private async sendMessage(text: string): Promise<boolean> {
    if (!this.botToken) {
      console.log('⚠️ Telegram bot token not configured');
      return false;
    }

    if (!this.chatId) {
      console.log('⚠️ Telegram chat ID not configured');
      return false;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text: text,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to send Telegram message:', await response.text());
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Telegram notification failed:', error.message);
      return false;
    }
  }

  // Send sync start notification
  async notifySyncStart(jobType: string): Promise<void> {
    const message = `🚀 *Backend Engineer*\n` +
      `Starting ${jobType} sync...\n` +
      `⏰ ${new Date().toLocaleString('zh-CN')}`;
    
    await this.sendMessage(message);
  }

  // Send sync completion notification
  async notifySyncComplete(
    jobType: string,
    result: {
      processed: number;
      added: number;
      updated: number;
      skipped: number;
      errors: number;
    }
  ): Promise<void> {
    const status = result.errors > 0 ? '⚠️' : '✅';
    const message = `${status} *${jobType} Sync Complete*\n\n` +
      `📊 Results:\n` +
      `• Processed: ${result.processed}\n` +
      `• Added: ${result.added}\n` +
      `• Updated: ${result.updated}\n` +
      `• Skipped: ${result.skipped}\n` +
      `• Errors: ${result.errors}\n\n` +
      `⏰ ${new Date().toLocaleString('zh-CN')}`;

    await this.sendMessage(message);
  }

  // Send error notification
  async notifyError(context: string, error: string): Promise<void> {
    const message = `❌ *Backend Engineer Error*\n\n` +
      `*Context:* ${context}\n` +
      `*Error:* \`${error.substring(0, 200)}\`\n\n` +
      `⏰ ${new Date().toLocaleString('zh-CN')}`;

    await this.sendMessage(message);
  }

  // Send daily summary
  async notifyDailySummary(stats: {
    totalBooks: number;
    todayAdded: number;
    todayUpdated: number;
  }): Promise<void> {
    const message = `📚 *Daily Summary*\n\n` +
      `📖 Total Books: ${stats.totalBooks}\n` +
      `✨ Added Today: ${stats.todayAdded}\n` +
      `🔄 Updated Today: ${stats.todayUpdated}\n\n` +
      `⏰ ${new Date().toLocaleString('zh-CN')}`;

    await this.sendMessage(message);
  }

  // Test the bot connection
  async testConnection(): Promise<boolean> {
    if (!this.botToken) {
      console.log('❌ Telegram bot token not configured');
      return false;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getMe`
      );
      
      if (!response.ok) {
        console.error('❌ Invalid bot token');
        return false;
      }

      const data = await response.json();
      console.log('✅ Telegram bot connected:', data.result.username);
      return true;
    } catch (error: any) {
      console.error('❌ Telegram connection failed:', error.message);
      return false;
    }
  }
}
