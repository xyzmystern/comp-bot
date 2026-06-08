import {
  Client,
  Collection,
  Events,
  REST,
  Routes,
  ChatInputCommandInteraction,
} from "discord.js";
import type { BotCommand } from "./types";
import { logger } from "../lib/logger";
import { db } from "@workspace/db";
import { guildSettingsTable, customCommandsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

// Import all built-in commands
import helpCmd from "./commands/help";
import banCmd from "./commands/ban";
import kickCmd from "./commands/kick";
import warnCmd from "./commands/warn";
import warningsCmd from "./commands/warnings";
import clearCmd from "./commands/clear";
import pingCmd from "./commands/ping";
import serverinfoCmd from "./commands/serverinfo";
import userinfoCmd from "./commands/userinfo";
import avatarCmd from "./commands/avatar";
import rollCmd from "./commands/roll";
import coinflipCmd from "./commands/coinflip";
import remindCmd from "./commands/remind";
import addcmdCmd from "./commands/addcmd";
import removecmdCmd from "./commands/removecmd";
import listcmdsCmd from "./commands/listcmds";
import prefixCmd from "./commands/prefix";
import welcomeCmd from "./commands/welcome";
import muteCmd from "./commands/mute";
import unmuteCmd from "./commands/unmute";

const BUILT_IN_COMMANDS: BotCommand[] = [
  helpCmd,
  banCmd,
  kickCmd,
  warnCmd,
  warningsCmd,
  clearCmd,
  pingCmd,
  serverinfoCmd,
  userinfoCmd,
  avatarCmd,
  rollCmd,
  coinflipCmd,
  remindCmd,
  addcmdCmd,
  removecmdCmd,
  listcmdsCmd,
  prefixCmd,
  welcomeCmd,
  muteCmd,
  unmuteCmd,
];

async function getPrefix(guildId: string): Promise<string> {
  try {
    const [settings] = await db
      .select()
      .from(guildSettingsTable)
      .where(eq(guildSettingsTable.guildId, guildId))
      .limit(1);
    return settings?.prefix ?? "!";
  } catch {
    return "!";
  }
}

async function registerSlashCommands(client: Client, commands: Collection<string, BotCommand>) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !client.application) return;

  const slashBodies = [...new Set(commands.values())]
    .filter((cmd) => cmd.slashData)
    .map((cmd) => cmd.slashData!.toJSON());

  try {
    const rest = new REST().setToken(token);
    await rest.put(Routes.applicationCommands(client.application.id), {
      body: slashBodies,
    });
    logger.info({ count: slashBodies.length }, "Registered global slash commands");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}

export async function registerEvents(
  client: Client,
  commands: Collection<string, BotCommand>,
): Promise<void> {
  // Register built-in commands into the collection
  for (const cmd of BUILT_IN_COMMANDS) {
    commands.set(cmd.name, cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        commands.set(alias, cmd);
      }
    }
  }

  // Register slash commands once the client is ready
  client.once(Events.ClientReady, async (c) => {
    await registerSlashCommands(c, commands);
  });

  // Handle slash command interactions
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = commands.get(interaction.commandName);
    if (!cmd?.executeSlash) {
      await interaction.reply({
        content: "❌ This command is not available as a slash command.",
        ephemeral: true,
      });
      return;
    }

    try {
      await cmd.executeSlash(interaction as ChatInputCommandInteraction);
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Slash command error");
      const payload = { content: "❌ An error occurred while running that command.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  });

  // Handle prefix-based message commands
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = await getPrefix(message.guild.id);

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    // Check built-in commands first
    const command = commands.get(commandName);
    if (command) {
      try {
        await command.execute({ client, message, args, commands, prefix });
      } catch (err) {
        logger.error({ err, commandName }, "Error executing prefix command");
        await message.reply("❌ An error occurred while running that command.");
      }
      return;
    }

    // Fall through to custom commands
    try {
      const [custom] = await db
        .select()
        .from(customCommandsTable)
        .where(
          and(
            eq(customCommandsTable.guildId, message.guild.id),
            eq(customCommandsTable.name, commandName),
          ),
        )
        .limit(1);

      if (custom) {
        await message.channel.send(custom.response);
      }
    } catch (err) {
      logger.error({ err }, "Error looking up custom command");
    }
  });

  // Welcome new members
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const [settings] = await db
        .select()
        .from(guildSettingsTable)
        .where(eq(guildSettingsTable.guildId, member.guild.id))
        .limit(1);

      if (settings?.welcomeChannelId) {
        const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
        if (channel?.isTextBased() && "send" in channel) {
          const msg =
            settings.welcomeMessage
              ?.replace("{user}", `<@${member.id}>`)
              .replace("{server}", member.guild.name)
              .replace("{count}", String(member.guild.memberCount)) ??
            `Welcome to **${member.guild.name}**, <@${member.id}>! 🎉`;
          await channel.send(msg);
        }
      }

      if (settings?.autoRoleId) {
        const role = member.guild.roles.cache.get(settings.autoRoleId);
        if (role) await member.roles.add(role);
      }
    } catch (err) {
      logger.error({ err }, "Error handling GuildMemberAdd");
    }
  });

  client.on(Events.Error, (err) => {
    logger.error({ err }, "Discord client error");
  });
}
