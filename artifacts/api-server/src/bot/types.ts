import type {
  Message,
  Client,
  Collection,
  ChatInputCommandInteraction,
} from "discord.js";

export interface CommandContext {
  client: Client;
  message: Message;
  args: string[];
  commands: Collection<string, BotCommand>;
  prefix: string;
}

/** Accepts any discord.js slash command builder variant (with or without subcommands/options). */
export type AnySlashCommandData = { name: string; toJSON(): object };

export interface BotCommand {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  category: "moderation" | "utility" | "fun" | "info" | "custom";
  requiresAdmin?: boolean;
  /** Slash command definition — omit to skip slash registration for this command */
  slashData?: AnySlashCommandData;
  execute(ctx: CommandContext): Promise<void>;
  executeSlash?(interaction: ChatInputCommandInteraction): Promise<void>;
}
