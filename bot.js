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

// Event handlers
function handleReady(client, config) {
    console.log(`${client.user.username} is online!`);
    console.log(`Joined ${client.guilds.cache.size} guild(s).`);

    if (config.customStatuses && config.customStatuses.length > 0) {
        updateCustomStatuses(client, config.customStatuses);
    }
}

function handleInteraction(interaction, config) {
    if (interaction.isCommand()) {
        const args = [];
        for (const option of interaction.options.data) {
            if (option.type === 'SUB_COMMAND') {
                args.push(option.name);
            } else if (option.type === 'STRING' || option.type === 'INTEGER') {
                args.push(option.value);
            }
        }
        handleCommand(interaction, null, args, config); // Pass null as the message object for slash commands
    } else if (interaction.isContextMenu()) {
        const args = [interaction.targetId];
        handleCommand(interaction, null, args, config); // Pass null as the message object for context menu commands
    }
}

function handleMessage(message, config) {
    if (message.author.bot) return; // Ignore messages from other bots

    const { prefix } = config;
    if (!message.content.startsWith(prefix)) return; // Ignore messages without the correct prefix

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = botCommands.get(`${prefix} ${commandName}`);
    if (command) {
        handleCommand(null, message, args, config); // Pass null as the interaction object for message commands
    } else {
        message.channel.send(`Invalid command. Type \`${prefix} help\` to see the list of commands.`);
    }
}

function handleMessageDelete(deletedMessage, config) {
    const logMessage = `A message was deleted: "${deletedMessage.content}"`;
    console.log(logMessage);

    const logChannelID = config.logChannels.messageDeleted;
    const logChannel = botClients.get(config.token)?.channels.cache.get(logChannelID);
    if (logChannel) {
        logChannel.send(logMessage);
    }
}

function handleGuildCreate(guild, config) {
    const logMessage = `Joined a new guild: ${guild.name} (ID: ${guild.id}).`;
    console.log(logMessage);

    const logChannelID = config.logChannels.joinedGuild;
    const logChannel = botClients.get(config.token)?.channels.cache.get(logChannelID);
    if (logChannel) {
        logChannel.send(logMessage);
    }
}

function handleGuildDelete(guild, config) {
    const logMessage = `Left a guild: ${guild.name} (ID: ${guild.id}).`;
    console.log(logMessage);

    const logChannelID = config.logChannels.leftGuild;
    const logChannel = botClients.get(config.token)?.channels.cache.get(logChannelID);
    if (logChannel) {
        logChannel.send(logMessage);
    }
}

// Function to update custom statuses
function updateCustomStatuses(client, customStatuses) {
    const updateStatus = () => {
        const statusIndex = Math.floor(Math.random() * customStatuses.length);
        const { type, text } = customStatuses[statusIndex];
        client.user.setPresence({
            activities: [{ type, name: text }],
            status: 'online',
        });
    };

    // Set custom status when the bot is ready
    updateStatus();

    // Update status every 10 minutes
    setInterval(updateStatus, 600000); // 10 minutes in milliseconds
}

// Function to handle commands
async function handleCommand(interaction, message, args, config) {
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

// Add common commands to the botCommands map
commonCommands.forEach((command) => {
    botCommands.set(command.name, command);
});

// Function to login each bot
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

// Login all bots
loginAllBots();
