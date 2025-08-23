import {Client, Events, GatewayIntentBits, MessageFlags} from 'discord.js';
import { connectDB } from "./mongoConfig.js";
import 'dotenv/config';
import {addCompetition, removeCompetition, setServerChannel} from "./serverConfig.js";
import {deleteCompetitionMessage, postCompetitionMessage} from "./match.js";
import * as cron from "node-cron";
import {COMPETITION_NAMES, postWeeklyOverviews, updateAllScores} from "./scheduledTasks.js";
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async c => {
    console.log(`Prêt ! Connecté en tant que ${c.user.tag}`);
    cron.schedule('0 8 * * 1', () => {
        console.log('🗓️ Envoi des matchs de la semaine...');
        postWeeklyOverviews(client);
    }, {
        timezone: "Europe/Paris"
    });

    cron.schedule('*/2 * * * *', () => {
        console.log('🔄️ Vérification et mise à jour des scores...');
        updateAllScores(client);
    }, {
        timezone: "Europe/Paris"
    });
});




client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: "Vous n'avez pas la permission d'utiliser cette commande.", flags: [MessageFlags.Ephemeral] });
    }

    const { commandName, guild, options } = interaction;
    const guildId = interaction.guild.id;
    await interaction.deferReply({flags: [MessageFlags.Ephemeral]});
    if (commandName === 'configure') {
        const channel = options.getChannel('channel');
        try {
            await setServerChannel(guildId, channel.id);
            await interaction.editReply({ content: `Canal défini sur #${channel.name}`});
        } catch (error) {
            console.error("Erreur lors de la configuration du serveur : ",error);
            await interaction.editReply({ content: "Une erreur est survenue lors de la configuration."});
        }
    }

    if (commandName === 'add-competition' || commandName === 'remove-competition') {
        const competition = options.getString('competition');
        const competitionName = COMPETITION_NAMES.filter(c => c.value === competition)[0].name;
        try {
            if (commandName === 'add-competition') {
                await postCompetitionMessage(guild, competition)
                await addCompetition(
                    guildId,
                    competition,
                    competitionName
                );
                await interaction.editReply({ content: "Le championnat a été ajouté et son programme a été posté !"});
            }else{
                await deleteCompetitionMessage(guild, competition);
                await removeCompetition(
                    guildId,
                    competition
                );
                await interaction.editReply({ content: "Le championnat a bien été supprimer"});
            }
        }catch (e) {
            console.error(e);
            await interaction.editReply({ content: "Une erreur est survenue."});
        }
    }
});

(async () => {
    try {
        await connectDB();
        console.log("Connexion à la base de données réussie.");
        await client.login(process.env.TOKEN);
    } catch (error) {
        console.error("Échec du démarrage du bot:", error);
    }
})();
