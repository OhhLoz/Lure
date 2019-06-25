const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");

const versionNumber = "1.0.0";


client.on("ready", () =>
{
  console.log(`Lure is currently serving ${client.users.filter(user => !user.bot).size} users, in ${client.channels.size} channels of ${client.guilds.size} servers. Alongside ${client.users.filter(user => user.bot).size} bot brothers.`);
  client.user.setActivity(`use .help`);
});

client.on("guildCreate", guild =>
{
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

client.on("guildDelete", guild =>
{
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

client.on("message", async message =>
{
  // Ignore other bots.
  if(message.author.bot) return;

  // Ignore any message that does not start with our prefix
  if(message.content.indexOf(config.prefix) !== 0) return;

  // Separate our command names, and command arguments
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command == "rps")
  {
    if (args.length == 0) // RPS with the bot
    {
      var originalAuthor = message.author;
      message.react('🇷')
      .then(() => message.react('🇵'))
      .then(() => message.react('🇸'))
      .catch(() => console.error('One of the emojis failed to react.'));

      const filter = (reaction, user) => {
        return ['🇷', '🇵', '🇸'].includes(reaction.emoji.name) && user.id === originalAuthor.id;
      };

      message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        .then(collected => {
          const reaction = collected.first();

          if (reaction.emoji.name === '🇷') {
            message.channel.send('you reacted with rock');
          }
          else if (reaction.emoji.name == '🇵')
          {
            message.channel.send('you reacted with paper');
          }
          else if (reaction.emoji.name == '🇸')
          {
            message.channel.send('you reacted with scissors');
          }
          else
          {
            message.channel.send('Error with detecting the reaction');
          }
        })
        .catch(collected => {
          message.channel.send('Error with waiting for the reaction');
        });
    }
  }
});

client.login(config.token);