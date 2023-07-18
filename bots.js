const { Client, MessageEmbed } = require('discord.js');
const axios = require('axios');

// User-defined bot configurations
const userBotConfigs = [
    {
        token: 'YOUR_BOT_1_TOKEN',
        prefix: '!bot1',
        logChannels: {
            messageDeleted: 'CHANNEL_ID_FOR_BOT_1_DELETED_MESSAGES', // Replace with the channel ID where you want to log deleted messages
            joinedGuild: 'CHANNEL_ID_FOR_BOT_1_JOINED_GUILD', // Replace with the channel ID where you want to log joined guilds
            leftGuild: 'CHANNEL_ID_FOR_BOT_1_LEFT_GUILD', // Replace with the channel ID where you want to log left guilds
        },
        customStatuses: [
            {
                type: 'PLAYING', // Possible values: 'PLAYING', 'WATCHING', 'LISTENING', 'STREAMING', 'COMPETING', or 'CUSTOM_STATUS'
                text: 'with humans!',
            },
            {
                type: 'WATCHING',
                text: 'over the server!',
            },
        ],
    },
    {
        token: 'YOUR_BOT_2_TOKEN',
        prefix: '!bot2',
        logChannels: {
            messageDeleted: 'CHANNEL_ID_FOR_BOT_2_DELETED_MESSAGES', // Replace with the channel ID where you want to log deleted messages
            joinedGuild: 'CHANNEL_ID_FOR_BOT_2_JOINED_GUILD', // Replace with the channel ID where you want to log joined guilds
            leftGuild: 'CHANNEL_ID_FOR_BOT_2_LEFT_GUILD', // Replace with the channel ID where you want to log left guilds
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
    channel.startTyping();
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 5000 + 2000));
    channel.stopTyping();
};

// Create and initialize bots
for (const config of userBotConfigs) {
    const client = new Client();

    // Event listeners for each bot
    client.on('ready', () => {
        console.log(`${client.user.username} is online!`);
        console.log(`Joined ${client.guilds.cache.size} guild(s).`);

        // Set custom statuses when the bot is ready
        if (config.customStatuses && config.customStatuses.length > 0) {
            const statusIndex = Math.floor(Math.random() * config.customStatuses.length);
            const { type, text } = config.customStatuses[statusIndex];
            client.user.setPresence({
                activity: { type, name: text },
                status: 'online',
            });

            // Update status every 10 minutes
            setInterval(() => {
                const statusIndex = Math.floor(Math.random() * config.customStatuses.length);
                const { type, text } = config.customStatuses[statusIndex];
                client.user.setPresence({
                    activity: { type, name: text },
                    status: 'online',
                });
            }, 600000); // 10 minutes in milliseconds
        }
    });

    client.on('message', async (message) => {
        if (message.author.bot) return; // Ignore messages from other bots

        const { prefix } = config;
        if (!message.content.startsWith(prefix)) return; // Ignore messages without the correct prefix

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = botCommands.get(client.token)?.get(commandName);
        if (command) {
            try {
                await command.execute(message, args);
            } catch (error) {
                console.error(error);
                message.channel.send('An error occurred while executing the command.');
                logErrorToChannel(message.channel, error);
            }
        } else {
            message.channel.send(`Invalid command. Type \`${prefix} help\` to see the list of commands.`);
        }
    });

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

    // Register custom events for each bot
    for (const [eventName, eventHandler] of botCustomEvents.get(config.token)?.entries() || []) {
        client.on(eventName, eventHandler);
    }

    botClients.set(config.token, client);
}

// Define and add commands to each bot
// (Add your commands for each bot here using botCommands.set() similar to previous examples)

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
            logErrorToChannel(client.channels.cache.find(channel => channel.type === 'text'), error);
        }
    }
}

loginAllBots();
