const { Client, Intents, MessageEmbed } = require('discord.js');

// Common commands array
const commonCommands = [
    {
        name: 'command1',
        description: 'Description for command1',
        execute: (interaction, message, args) => {
            // Your command1 logic here
        },
    },
    {
        name: 'command2',
        description: 'Description for command2',
        execute: (interaction, message, args) => {
            // Your command2 logic here
        },
    },
    // Add more common commands here
    {
        name: 'eval',
        description: 'Evaluate JavaScript code',
        execute: (interaction, message, args) => {
            // Check if the user is a bot owner (replace 'YOUR_BOT_OWNER_ID' with the actual owner ID)
            if (!botOwners.has(interaction?.user?.id || message?.author?.id)) {
                return interaction
                    ? interaction.reply({ content: 'Only bot owners can use this command.', ephemeral: true })
                    : message.channel.send('Only bot owners can use this command.');
            }

            const code = args.join(' ');
            try {
                const result = eval(code);
                const output = result instanceof Object ? JSON.stringify(result, null, 2) : String(result);

                const response = `\`\`\`js\n${output}\`\`\``;
                interaction ? interaction.reply(response) : message.channel.send(response);
            } catch (error) {
                const errorMessage = `\`\`\`js\n${error}\`\`\``;
                interaction ? interaction.reply(errorMessage) : message.channel.send(errorMessage);
            }
        },
    },
];

// User-defined bot configurations
const userBotConfigs = [
    {
        token: 'YOUR_BOT_1_TOKEN',
        prefix: '!bot1',
        logChannels: {
            messageDeleted: 'CHANNEL_ID_FOR_BOT_1_DELETED_MESSAGES',
            joinedGuild: 'CHANNEL_ID_FOR_BOT_1_JOINED_GUILD',
            leftGuild: 'CHANNEL_ID_FOR_BOT_1_LEFT_GUILD',
        },
        customStatuses: [
            {
                type: 'PLAYING',
                text: 'with humans!',
            },
            {
                type: 'WATCHING',
                text: 'over the server!',
            },
        ],
        enabledCommands: ['command1', 'command2', 'eval'], // Add the names of the enabled commands here
    },
    {
        token: 'YOUR_BOT_2_TOKEN',
        prefix: '!bot2',
        logChannels: {
            messageDeleted: 'CHANNEL_ID_FOR_BOT_2_DELETED_MESSAGES',
            joinedGuild: 'CHANNEL_ID_FOR_BOT_2_JOINED_GUILD',
            leftGuild: 'CHANNEL_ID_FOR_BOT_2_LEFT_GUILD',
        },
        customStatuses: [
            {
                type: 'WATCHING',
                text: 'for your commands!',
            },
            {
                type: 'PLAYING',
                text: 'with moderation settings.',
            },
        ],
        enabledCommands: ['command1', 'command2', 'eval'], // Add the names of the enabled commands here
    },
    // Add more bot configurations as needed
];

// Bot owners (Replace 'YOUR_BOT_OWNER_ID' with the actual user ID of the bot owner)
const botOwners = new Set(['YOUR_BOT_OWNER_ID']);

// Utility functions for webhook logging
function logErrorToChannel(channel, error) {
    const logEmbed = new MessageEmbed().setColor('#ff0000').setTitle('Error').setDescription(error.message);
    channel.send({ embeds: [logEmbed] });
}

// Function to register slash commands for each bot
async function registerSlashCommands(client, config) {
    const enabledCommands = commonCommands.filter((command) => config.enabledCommands.includes(command.name));

    try {
        await client.application?.commands.set(enabledCommands);
        console.log(`Registered slash commands for ${client.user.username}.`);
    } catch (error) {
        console.error(`Failed to register slash commands for ${client.user.username}: ${error.message}`);
    }
}

// Create and initialize bots
const botClients = new Map();

for (const config of userBotConfigs) {
    const client = new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    });

    botClients.set(config.token, client);

    client.once('ready', () => {
        console.log(`${client.user.username} is online!`);
        console.log(`Joined ${client.guilds.cache.size} guild(s).`);

        // Set custom statuses when the bot is ready
        if (config.customStatuses && config.customStatuses.length > 0) {
            const updateCustomStatus = () => {
                const statusIndex = Math.floor(Math.random() * config.customStatuses.length);
                const { type, text } = config.customStatuses[statusIndex];
                client.user.setPresence({
                    activities: [{ type, name: text }],
                    status: 'online',
                });
            };

            updateCustomStatus(); // Set initial custom status
            setInterval(updateCustomStatus, 600000); // Update status every 10 minutes
        }

        // Register slash commands
        registerSlashCommands(client, config);
    });

    // Register message commands
    const enabledMessageCommands = commonCommands.filter((command) => config.enabledCommands.includes(command.name));
    enabledMessageCommands.forEach((command) => {
        botCommands.set(`${config.prefix} ${command.name}`, command);
    });

    // Event listener for slash command interactions and context menu commands
    client.on('interactionCreate', async (interaction) => {
        if (interaction.isCommand()) {
            const args = [];
            for (const option of interaction.options.data) {
                if (option.type === 'SUB_COMMAND') {
                    args.push(option.name);
                } else if (option.type === 'STRING' || option.type === 'INTEGER') {
                    args.push(option.value);
                }
            }
            handleCommand(interaction, null, args); // Pass null as the message object for slash commands
        } else if (interaction.isContextMenu()) {
            const args = [interaction.targetId];
            handleCommand(interaction, null, args); // Pass null as the message object for context menu commands
        }
    });

    // Event listener for message commands
    client.on('messageCreate', (message) => {
        if (message.author.bot) return; // Ignore messages from other bots

        const { prefix } = config;
        if (!message.content.startsWith(prefix)) return; // Ignore messages without the correct prefix

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = botCommands.get(`${prefix} ${commandName}`);
        if (command) {
            handleCommand(null, message, args); // Pass null as the interaction object for message commands
        } else {
            message.channel.send(`Invalid command. Type \`${prefix} help\` to see the list of commands.`);
        }
    });

    // Event listener for handling both slash commands and message commands
    async function handleCommand(interaction, message, args) {
        const commandName = interaction ? interaction.commandName : args.shift().toLowerCase();

        const command = botCommands.get(commandName);
        if (command) {
            try {
                command.execute(interaction, message, args);
            } catch (error) {
                console.error(error);
                if (interaction && interaction.replied) {
                    interaction.followUp({ content: 'An error occurred while executing the command.', ephemeral: true });
                } else if (message) {
                    message.channel.send('An error occurred while executing the command.');
                }
                logErrorToChannel(interaction ? interaction.channel : message.channel, error);
            }
        } else {
            if (interaction && interaction.replied) {
                interaction.followUp({ content: `Unknown command: ${commandName}`, ephemeral: true });
            } else if (message) {
                message.channel.send(`Unknown command: ${commandName}`);
            }
        }
    }

    // Message Delete Event Listener
    client.on('messageDelete', (deletedMessage) => {
        const logMessage = `A message was deleted: "${deletedMessage.content}"`;
        console.log(logMessage);

        const logChannelID = config.logChannels.messageDeleted;
        const logChannel = client.channels.cache.get(logChannelID);
        if (logChannel) {
            logChannel.send(logMessage);
        }
    });

    // Guild Create Event Listener
    client.on('guildCreate', (guild) => {
        const logMessage = `Joined a new guild: ${guild.name} (ID: ${guild.id}).`;
        console.log(logMessage);

        const logChannelID = config.logChannels.joinedGuild;
        const logChannel = client.channels.cache.get(logChannelID);
        if (logChannel) {
            logChannel.send(logMessage);
        }
    });

    // Guild Delete Event Listener
    client.on('guildDelete', (guild) => {
        const logMessage = `Left a guild: ${guild.name} (ID: ${guild.id}).`;
        console.log(logMessage);

        const logChannelID = config.logChannels.leftGuild;
        const logChannel = client.channels.cache.get(logChannelID);
        if (logChannel) {
            logChannel.send(logMessage);
        }
    }
}

// Command map for each bot
const botCommands = new Map();

// Add common commands to the botCommands map
commonCommands.forEach((command) => {
    botCommands.set(command.name, command);
});

// Login each bot
async function loginAllBots() {
    for (const [token, client] of botClients) {
        try {
            await client.login(token);
        } catch (error) {
            console.error(`Bot ${client.user.username} failed to log in: ${error.message}`);
            logErrorToChannel(client.channels.cache.find((channel) => channel.type === 'GUILD_TEXT'), error);
        }
    }
}

loginAllBots();
