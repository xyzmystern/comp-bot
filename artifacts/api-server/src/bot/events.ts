import {
  Client,
  Collection,
  Events,
  REST,
  Routes,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import type { BotCommand } from "./types";
import { logger } from "../lib/logger";
import { db } from "@workspace/db";
import {
  guildSettingsTable,
  customCommandsTable,
  competitivePlayersTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

// Modal field IDs
import {
  REGISTER_MODAL_ID,
  FIELD_IGN,
  FIELD_COUNTRY,
  FIELD_REGION,
  FIELD_PLATFORM,
  FIELD_GAMEID,
} from "./commands/register";

// Built-in commands
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
import registerCmd from "./commands/register";
import praddCmd from "./commands/pradd";
import prremoveCmd from "./commands/prremove";
import leaderboardCmd from "./commands/leaderboard";

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
  registerCmd,
  praddCmd,
  prremoveCmd,
  leaderboardCmd,
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

async function registerSlashCommands(
  client: Client,
  commands: Collection<string, BotCommand>,
) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !client.application) return;

  const seen = new Set<string>();
  const slashBodies = [...commands.values()]
    .filter((cmd) => {
      if (!cmd.slashData || seen.has(cmd.name)) return false;
      seen.add(cmd.name);
      return true;
    })
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
  for (const cmd of BUILT_IN_COMMANDS) {
    commands.set(cmd.name, cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        commands.set(alias, cmd);
      }
    }
  }

  client.once(Events.ClientReady, async (c) => {
    await registerSlashCommands(c, commands);
  });

  // Slash command + modal interactions
  client.on(Events.InteractionCreate, async (interaction) => {
    // Slash commands
    if (interaction.isChatInputCommand()) {
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
        const payload = { content: "❌ An error occurred.", ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => null);
        } else {
          await interaction.reply(payload).catch(() => null);
        }
      }
      return;
    }

    // Modal submissions
    if (interaction.isModalSubmit()) {
      if (interaction.customId === REGISTER_MODAL_ID) {
        const ign = interaction.fields.getTextInputValue(FIELD_IGN).trim();
        const country = interaction.fields.getTextInputValue(FIELD_COUNTRY).trim();
        const region = interaction.fields.getTextInputValue(FIELD_REGION).trim().toUpperCase();
        const platform = interaction.fields.getTextInputValue(FIELD_PLATFORM).trim();
        const gameId = interaction.fields.getTextInputValue(FIELD_GAMEID).trim();

        try {
          const [existing] = await db
            .select()
            .from(competitivePlayersTable)
            .where(
              and(
                eq(competitivePlayersTable.guildId, interaction.guildId!),
                eq(competitivePlayersTable.userId, interaction.user.id),
              ),
            )
            .limit(1);

          if (existing) {
            await db
              .update(competitivePlayersTable)
              .set({ ign, country, region, platform, gameId, updatedAt: new Date() })
              .where(eq(competitivePlayersTable.id, existing.id));
          } else {
            await db.insert(competitivePlayersTable).values({
              guildId: interaction.guildId!,
              userId: interaction.user.id,
              ign,
              country,
              region,
              platform,
              gameId,
              pr: 0,
            });
          }

          const embed = new EmbedBuilder()
            .setColor(0x00cc99)
            .setTitle("✅ Registration Complete")
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
              { name: "In-Game Name", value: ign, inline: true },
              { name: "Country", value: country, inline: true },
              { name: "Region", value: region, inline: true },
              { name: "Platform", value: platform, inline: true },
              { name: "Game ID", value: gameId, inline: true },
            )
            .setFooter({ text: `Registered for ${interaction.guild?.name ?? "BuildNow GG Scrims"}` })
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (err) {
          logger.error({ err }, "Error saving competitive registration");
          await interaction.reply({
            content: "❌ Failed to save your registration. Please try again.",
            ephemeral: true,
          });
        }
        return;
      }
    }
  });

  // Prefix message commands
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = await getPrefix(message.guild.id);
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

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

    // Custom commands fallback
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
