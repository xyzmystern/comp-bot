import type { Message, Client, Collection } from "discord.js";

export interface CommandContext {
  client: Client;
  message: Message;
  args: string[];
  commands: Collection<string, BotCommand>;
  prefix: string;
}

export interface BotCommand {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  category: "moderation" | "utility" | "fun" | "info" | "custom";
  requiresAdmin?: boolean;
  execute(ctx: CommandContext): Promise<void>;
}
