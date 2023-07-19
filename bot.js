const { Client, Intents, MessageEmbed } = require('discord.js');

// Common commands array
const commonCommands = [
    {
        name: 'command1',
        description: 'Description for command1',
        execute: (interaction, message, args) => {
            // Your command1 logic here
            // 'interaction' is the interaction object for slash commands
            // 'message' is the message object for message commands
            // 'args' is an array of command arguments
        },
    },
    {
        name: 'command2',
        description: 'Description for command2',
        execute: (interaction, message, args) => {
            // Your command2 logic here
            // 'interaction' is the interaction object for slash commands
            // 'message' is the message object for message commands
            // 'args' is an array of command arguments
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

// Create client instances for each bot
const botClients = new Map();

// Create a command handler
class CommandHandler {
    constructor(prefix) {
        this.prefix = prefix;
        this.cooldowns = new Map();
    }

    handleCommand(interaction, message, args) {
        const commandName = interaction ? interaction.commandName : args.shift().toLowerCase();
        const command = this.getCommand(commandName);

        if (command) {
            this.executeCommand(command, interaction, message, args);
        } else {
            this.sendErrorMessage(
                interaction ? interaction.channel : message.channel,
                `Unknown command: ${commandName}`
            );
        }
    }

    getCommand(commandName) {
        return botCommands.get(`${this.prefix} ${commandName}`);
    }

    async executeCommand(command, interaction, message, args) {
        // Cooldown handling
        if (interaction) {
            const commandKey = interaction.user.id;
            if (this.cooldowns.has(commandKey)) {
                this.sendErrorMessage(
                    interaction.channel,
                    'You are on cooldown for this command. Please wait a bit before using it again.'
                );
                return;
            }

            this.cooldowns.set(commandKey, true);
            setTimeout(() => this.cooldowns.delete(commandKey), command.cooldown || 3000); // 3 seconds by default
        }

        try {
            await command.execute(interaction, message, args);
        } catch (error) {
            console.error(error);
            this.sendErrorMessage(
                interaction ? interaction.channel : message.channel,
                'An error occurred while executing the command.'
            );
            logErrorToChannel(
                interaction ? interaction.channel : message.channel,
                error
            );
        }
    }

    sendErrorMessage(channel, errorMessage) {
        channel.send(`❌ ${errorMessage}`);
    }
}

// Utility functions for webhook logging
function logErrorToChannel(channel, error) {
    const logEmbed = new MessageEmbed().setColor('#ff0000').setTitle('Error').setDescription(error.message);
    channel.send({ embeds: [logEmbed] });
}

// Function to register slash commands for each bot
async function registerSlashCommands(client, config) {
    const commandHandler = new CommandHandler(config.prefix);
    const enabledCommands = commonCommands.filter((command) =>
        config.enabledCommands.includes(command.name)
    );

    try {
        await client.application?.commands.set(enabledCommands);
        console.log(`Registered slash commands for ${client.user.username}.`);
    } catch (error) {
        console.error(`Failed to register slash commands for ${client.user.username}: ${error.message}`);
    }

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
            commandHandler.handleCommand(interaction, null, args); // Pass null as the message object for slash commands
        } else if (interaction.isContextMenu()) {
            const args = [interaction.targetId];
            commandHandler.handleCommand(interaction, null, args); // Pass null as the message object for context menu commands
        }
    });
}

// Event listeners for each bot
function setupBotEventListeners(client, config) {
    const commandHandler = new CommandHandler(config.prefix);

    client.on('ready', () => {
        console.log(`${client.user.username} is online!`);
        console.log(`Joined ${client.guilds.cache.size} guild(s).`);

        if (config.customStatuses && config.customStatuses.length > 0) {
            setRandomCustomStatus(client, config.customStatuses);
            setInterval(() => setRandomCustomStatus(client, config.customStatuses), 600000); // 10 minutes
        }

        registerSlashCommands(client, config);
    });

    client.on('messageCreate', (message) => {
        if (message.author.bot) return; // Ignore messages from other bots

        const { prefix } = config;
        if (!message.content.startsWith(prefix)) return; // Ignore messages without the correct prefix

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        commandHandler.handleCommand(null, message, args); // Pass null as the interaction object for message commands
    });

    client.on('messageDelete', (deletedMessage) => {
        const logMessage = `A message was deleted: "${deletedMessage.content}"`;
        console.log(logMessage);

        const logChannelID = config.logChannels.messageDeleted;
        const logChannel = client.channels.cache.get(logChannelID);
        if (logChannel) {
            logChannel.send(logMessage);
        }
    });

    client.on('guildCreate', (guild) => {
        const logMessage = `Joined a new guild: ${guild.name} (ID: ${guild.id}).`;
        console.log(logMessage);

        const logChannelID = config.logChannels.joinedGuild;
        const logChannel = client.channels.cache.get(logChannelID);
        if (logChannel) {
            logChannel.send(logMessage);
        }
    });

    client.on('guildDelete', (guild) => {
        const logMessage = `Left a guild: ${guild.name} (ID: ${guild.id}).`;
        console.log(logMessage);

        const logChannelID = config.logChannels.leftGuild;
        const logChannel = client.channels.cache.get(logChannelID);
        if (logChannel) {
            logChannel.send(logMessage);
        }
    });
}

function setRandomCustomStatus(client, customStatuses) {
    const statusIndex = Math.floor(Math.random() * customStatuses.length);
    const { type, text } = customStatuses[statusIndex];
    client.user.setPresence({
        activities: [{ type, name: text }],
        status: 'online',
    });
}

// Add common commands to the botCommands map
const botCommands = new Map();
commonCommands.forEach((command) => {
    botCommands.set(command.name, command);
});

// Create and initialize bots
for (const config of userBotConfigs) {
    const client = new Client({
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        ],
    });

    // Register message commands
    const enabledMessageCommands = commonCommands.filter((command) =>
        config.enabledCommands.includes(command.name)
    );
    enabledMessageCommands.forEach((command) => {
        botCommands.set(`${config.prefix} ${command.name}`, command);
    });

    // Setup event listeners for the bot
    setupBotEventListeners(client, config);

    botClients.set(config.token, client);
}

// Login each bot
async function loginAllBots() {
    for (const [token, client] of botClients) {
        try {
            await client.login(token);
        } catch (error) {
            console.error(`Bot ${client.user.username} failed to log in: ${error.message}`);
            logErrorToChannel(
                client.channels.cache.find((channel) => channel.type === 'GUILD_TEXT'),
                error
            );
            // Handle login errors more effectively, e.g., retrying the login
        }
    }
}

loginAllBots();
