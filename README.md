# Multi-Bot Madness 🤖🎉 (Experimental)

[![Bot License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/EkamAujla/Multi-Bots)

Welcome to Multi-Bot Madness, where bot management reaches new heights! 🚀

## Table of Contents 📚

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
- [Bot Configuration](#bot-configuration)
- [Commands](#commands)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Introduction 💡

Multi-Bot Madness is a versatile Discord bot script that enables you to unleash multiple bots with just one script. Manage your bots effortlessly and execute various commands across different servers with ease.

## Features 🚀

- Run multiple bots from a single script 🤖
- Support for slash commands and message commands 🌐
- Enable/disable commands for each bot 🎛️
- Funny and engaging interactions with users 🎉
- Eval command for executing JavaScript code in Discord 💡
- Seamless event handling and logging 📜

## Getting Started 🛠️

1. Clone this repository to your local machine.
2. Install the required dependencies using `npm install`.
3. Configure your Discord bot tokens and other settings in the `userBotConfigs` array.
4. Add your bot-specific commands to the `commonCommands` array.
5. Customize your bot's appearance and functionality as you wish!
6. Run the script with `node bot.js` and witness the Multi-Bot Madness in action!

## Bot Configuration ⚙️

Edit the `userBotConfigs` array in `bot.js` to configure your bots:

```javascript
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
            // Custom statuses for bot1
            // ...
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
            // Custom statuses for bot2
            // ...
        ],
        enabledCommands: ['command1', 'command2', 'eval'], // Add the names of the enabled commands here
    },
    // Add more bot configurations as needed
];
```

## Commands 📜

Multi-Bot Madness supports various commands that you can execute in your Discord server. Here are some of the commands:

- `!bot1 command1`: Execute command1 for bot1
- `!bot2 command2`: Execute command2 for bot2
- `!bot1 eval <code>`: Evaluate JavaScript code as bot1 (bot owner only)

For a full list of available commands, type `!help` or `/help` in your Discord server.

## Examples 🌟

Here are some fun examples of how you can interact with your bots:

- `!bot1 joke`: Get a hilarious joke from bot1
- `!bot2 gif dance`: Watch bot2 do a funny dance

## Contributing 🤝

We welcome contributions to Multi-Bot Madness! Feel free to submit bug reports, feature requests, or pull requests. Let's make this project even better together! 🌟

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

Huge thanks to the creators of Discord.js for providing an awesome library that made this project possible. Special shoutout to the Discord community for their continuous support and enthusiasm! 🎉

---

Let's embark on a journey of Multi-Bot Madness! Feel free to fork, customize, and make it your own. Enjoy the chaos, fun, and endless possibilities with Multi-Bot Madness! 😄🎉
