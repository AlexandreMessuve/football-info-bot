import {ApplicationCommandOptionType, REST, Routes} from 'discord.js';
import 'dotenv/config';
import {COMPETITION_NAMES} from "./scheduledTasks.js";

const commands = [
    {
        name: 'configure',
        description: 'Configure le canal pour les annonces des matchs.',
        options: [
            {
                name: 'channel',
                type: 7,
                description: 'Le canal où les matchs seront affichés.',
                required: true,
            }
        ],
    },
    {
        name: 'add-competition',
        description: 'Ajouter un championnat  à surveiller',
        options: [{
            name: 'competition',
            type: ApplicationCommandOptionType.String,
            description: 'Choisissez un championnat à ajouter',
            required: true,
            choices: COMPETITION_NAMES
        }]
    },
    {
        name: 'remove-competition',
        description: 'Supprimer un championnat de votre surveillance',
        options: [{
            name: 'competition',
            type: ApplicationCommandOptionType.String,
            description: 'Choisissez un championnat à supprimer',
            required: true,
            choices: COMPETITION_NAMES
        }]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Déploiement des commandes (/) commencé.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Commandes (/) déployées avec succès.');
    } catch (error) {
        console.error(error);
    }
})();