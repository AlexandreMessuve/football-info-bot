import {MessageFlags} from "discord.js";
import i18next from "i18next";
import {getChoice} from "../utils/util.js";

export default async(interaction) => {
        const commandName = interaction.commandName;
        const command = interaction.client.commands.get(commandName);
        if (!command) {
            console.error(`No command match with ${commandName}`)
            return;
        }
        const lang = interaction.locale ?? 'en';
        if (lang) {
            await i18next.changeLanguage(lang);
        }
        if (interaction.isChatInputCommand()) {
            if (!interaction.member.permissions.has('Administrator')) {
                return interaction.editReply({ content: i18next.t('noPermission'),flags: [MessageFlags.Ephemeral]});
            }
            try {
                await command.execute(interaction);
            } catch (err) {
                console.error(err);
                await interaction.editReply({content: i18next.t('errorMessage'), flags: [MessageFlags.Ephemeral]});
            }
        }
        if (interaction.isAutocomplete()){
            const type = commandName === 'add-league' ? 'add': 'remove';
            try {
                const choices = await getChoice(interaction.guild.id, type);
                interaction.respond(choices);
            }catch(err){
                console.error(err);
                await interaction.respond([]);
            }
        }
}