import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "ping",
  description: "Check the bot's latency",
  usage: "ping",
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency"),

  async execute({ client, message }) {
    const sent = await message.reply("🏓 Pinging...");
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const wsLatency = Math.round(client.ws.ping);
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🏓 Pong!")
      .addFields(
        { name: "Message Latency", value: `${latency}ms`, inline: true },
        { name: "WebSocket Latency", value: `${wsLatency}ms`, inline: true },
      );
    await sent.edit({ content: null, embeds: [embed] });
  },

  async executeSlash(interaction) {
    const wsLatency = Math.round(interaction.client.ws.ping);
    await interaction.deferReply();
    const reply = await interaction.fetchReply();
    const latency = reply.createdTimestamp - interaction.createdTimestamp;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🏓 Pong!")
      .addFields(
        { name: "Message Latency", value: `${latency}ms`, inline: true },
        { name: "WebSocket Latency", value: `${wsLatency}ms`, inline: true },
      );
    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
