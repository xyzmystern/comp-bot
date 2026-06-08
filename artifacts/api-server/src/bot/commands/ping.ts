import { EmbedBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "ping",
  description: "Check the bot's latency",
  usage: "ping",
  category: "utility",
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
};

export default command;
