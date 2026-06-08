import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import type { BotCommand } from "../types";

export const REGISTER_MODAL_ID = "competitive_register";
export const FIELD_IGN = "comp_ign";
export const FIELD_COUNTRY = "comp_country";
export const FIELD_REGION = "comp_region";
export const FIELD_PLATFORM = "comp_platform";
export const FIELD_GAMEID = "comp_gameid";

const command: BotCommand = {
  name: "register",
  description: "Register your profile for the competitive system",
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your profile for the competitive system"),

  async execute({ message }) {
    await message.reply("❌ Please use the slash command `/register` to register — it uses an interactive form.");
  },

  async executeSlash(interaction) {
    const modal = new ModalBuilder()
      .setCustomId(REGISTER_MODAL_ID)
      .setTitle("Competitive Registration");

    const ignInput = new TextInputBuilder()
      .setCustomId(FIELD_IGN)
      .setLabel("BuildNow GG In-Game Name")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Your in-game username")
      .setMaxLength(32)
      .setRequired(true);

    const countryInput = new TextInputBuilder()
      .setCustomId(FIELD_COUNTRY)
      .setLabel("Country")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. United States, Germany, Brazil")
      .setMaxLength(50)
      .setRequired(true);

    const regionInput = new TextInputBuilder()
      .setCustomId(FIELD_REGION)
      .setLabel("Region")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. EU, NA, NAE, NAW, NAC, OCE, ASIA")
      .setMaxLength(10)
      .setRequired(true);

    const platformInput = new TextInputBuilder()
      .setCustomId(FIELD_PLATFORM)
      .setLabel("Platform")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("e.g. PC, Mobile, Console")
      .setMaxLength(10)
      .setRequired(true);

    const gameIdInput = new TextInputBuilder()
      .setCustomId(FIELD_GAMEID)
      .setLabel("BuildNow GG Game ID")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Your BuildNow GG game ID")
      .setMaxLength(50)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(ignInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(countryInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(regionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(platformInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(gameIdInput),
    );

    await interaction.showModal(modal);
  },
};

export default command;
