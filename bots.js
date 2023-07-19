const { Client, Intents, MessageEmbed } = require('discord.js');
const axios = require('axios');

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
        enabledCommands: ['command1', 'command2'], // Add the names of the enabled commands here
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
        enabledCommands: ['command1', 'command2'], // Add the names of the enabled commands here
    },
    // Add more bot configurations as needed
];

// Bot owners (Replace 'YOUR_BOT_OWNER_ID' with the actual user ID of the bot owner)
const botOwners = new Set(['YOUR_BOT_OWNER_ID']);

// Create client instances for each bot
const botClients = new Map();

// Command map for each bot
const botCommands = new Map();

// Custom event map for each bot
const botCustomEvents = new Map();

// Utility functions for webhook logging
function logErrorToChannel(channel, error) {
    const logEmbed = new MessageEmbed().setColor('#ff0000').setTitle('Error').setDescription(error.message);
    channel.send({ embeds: [logEmbed] });
}

// Typing Indicator
const simulateTyping = async (channel) => {
    channel.sendTyping();
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 5000 + 2000));
    channel.stopTyping();
};

// Function to register slash commands for each bot
async function registerSlashCommands(client) {
    const config = userBotConfigs.find((bot) => bot.token === client.token);

    const enabledCommands = commonCommands.filter((command) => config.enabledCommands.includes(command.name));

    try {
        await client.application?.commands.set(enabledCommands);
        console.log(`Registered slash commands for ${client.user.username}.`);
    } catch (error) {
        console.error(`Failed to register slash commands for ${client.user.username}: ${error.message}`);
    }
}

// Create and initialize bots
for (const config of userBotConfigs) {
    const client = new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
    });

    // Event listeners for each bot
    client.on('ready', () => {
        console.log(`${client.user.username} is online!`);
        console.log(`Joined ${client.guilds.cache.size} guild(s).`);

        // Set custom statuses when the bot is ready
        if (config.customStatuses && config.customStatuses.length > 0) {
            const statusIndex = Math.floor(Math.random() * config.customStatuses.length);
            const { type, text } = config.customStatuses[statusIndex];
            client.user.setPresence({
                activities: [{ type, name: text }],
                status: 'online',
            });

            // Update status every 10 minutes
            setInterval(() => {
                const statusIndex = Math.floor(Math.random() * config.customStatuses.length);
                const { type, text } = config.customStatuses[statusIndex];
                client.user.setPresence({
                    activities: [{ type, name: text }],
                    status: 'online',
                });
            }, 600000); // 10 minutes in milliseconds
        }

        // Register slash commands
        registerSlashCommands(client);
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
    });

    botClients.set(config.token, client);
}

// Add common commands to the botCommands map
commonCommands.forEach((command) => {
    botCommands.set(command.name, command);
});

// Define and add additional commands specific to each bot
// (Add your bot-specific commands to the botCommands map)

// Greeting and Farewell Messages
for (const [, client] of botClients) {
    client.on('guildMemberAdd', (member) => {
        const welcomeMessage = `Welcome, ${member.user.username}! We're glad to have you here.`;
        member.guild.systemChannel.send(welcomeMessage);
    });

    client.on('guildMemberRemove', (member) => {
        const farewellMessage = `Goodbye, ${member.user.username}. We hope to see you again soon!`;
        member.guild.systemChannel.send(farewellMessage);
    });
}

// Add custom events for each bot (Example)
const bot1CustomEvents = new Map([
    [
        'customEventName',
        (arg1, arg2) => {
            console.log(`Custom event triggered for bot1 with arguments: ${arg1}, ${arg2}`);
        },
    ],
]);

botCustomEvents.set('YOUR_BOT_1_TOKEN', bot1CustomEvents);

// Login each bot
async function loginAllBots() {
    for (const [token, client] of botClients) {
        try {
            await client.login(token);
        } catch (error) {
            console.error(`Bot ${client.user.username} failed to log in: ${error.message}`);
            logErrorToChannel(client.channels.cache.find(channel => channel.type === 'GUILD_TEXT'), error);
        }
    }
}

loginAllBots();
