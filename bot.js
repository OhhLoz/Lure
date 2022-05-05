const { Client, Intents } = require('discord.js');
const Discord = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

const testConfig = require("./config.json");
process.env.prefix = testConfig.prefix;
process.env.BOT_TOKEN = testConfig.token;
const package = require("./package.json");

var titleSpacer = "\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800\u2800";

var servercount = 0;
var usercount = 0;
var botcount = 0;
var channelcount = 0;

let getTime = (milli) => {
  let time = new Date(milli);
  let hours = time.getUTCHours();
  let minutes = time.getUTCMinutes();
  let seconds = time.getUTCSeconds();
  let milliseconds = time.getUTCMilliseconds();
  return hours + "H " + minutes + "M " + seconds + "S";
}

client.on("ready", () =>
{
  client.guilds.cache.forEach((guild) =>
  {
    if (guild.id == "264445053596991498")
      return;

    servercount += 1;
    channelcount += guild.channels.cache.filter(channel => channel.type != 'category').size;
    //usercount += guild.members.filter(member => !member.user.bot).size;
    usercount += guild.memberCount;
    botcount += guild.members.cache.filter(member => member.user.bot).size;
  })

  const guild = client.guilds.cache.get('509391645226172420'); //development server guildid
  let commands;

  if(guild)
    commands = guild.commands;
  else
    commands = client.application.commands;

  commands?.create({
    name: 'help',
    description: 'Lists all bot commands',
  })

  commands?.create({
    name: 'ping',
    description: 'Displays the current ping to the bot & the API',
  })

  commands?.create({
    name: 'stats',
    description: 'Lists bots current stats',
  })

  commands?.create({
    name: 'stop',
    description: 'Stops anything the bot is playing',
  })

  console.log(`Lure is currently serving ${usercount} users, in ${channelcount} channels of ${servercount} servers. Alongside ${botcount} bot brothers.`);
  client.user.setActivity(`${usercount} users | /help`, { type: 'WATCHING' });
});

client.on("guildCreate", guild =>
{
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

client.on("guildDelete", guild =>
{
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

client.on("interactionCreate", async (interaction) =>
{
  if (!interaction.isCommand())
    return;

  const {commandName, options} = interaction;

  if (commandName === 'help')
  {
    var embed = new Discord.MessageEmbed()
    .setTitle("Help")
    .setColor(0xff8d00)
    .setTimestamp()
    .setFooter({text: "Sent by HLTVBot", iconURL: client.user.displayAvatarURL()})
    .addField('\u200b', `${titleSpacer}**Bot Commands**`)
    .addField("/help", "Lists all current commands", false)
    .addField("/ping", "Displays the current ping to the bot & the API", false)
    .addField("/stats", "Displays bot statistics, invite link and contact information", false)

    interaction.reply
    ({
      embeds: [embed],
      ephemeral: true
    })
  }

  if (commandName === 'ping')
  {
    try
    {
      const message = await interaction.reply({ content: "Pong!", fetchReply: true, ephemeral: true });

      await interaction.editReply(
      {
        content: `Bot Latency: \`${message.createdTimestamp - interaction.createdTimestamp}ms\`, Websocket Latency: \`${client.ws.ping}ms\``,
        ephemeral: true
      });
    }
    catch (err)
    {
      console.log("Exception caught at /ping => ", err);
    }
  }

  if(commandName === 'stats')
  {
    var embed = new Discord.MessageEmbed()
    .setTitle("Bot Stats")
    .setColor(0xff8d00)
    .setTimestamp()
    .setThumbnail(client.user.avatarURL)
    .setFooter({text: "Sent by Lure", iconURL: client.user.displayAvatarURL()})
    .addField("User Count", usercount.toString(), true)
    .addField("Bot User Count", botcount.toString(), true)
    .addField("Server Count", servercount.toString(), true)
    .addField("Channel Count", channelcount.toString(), true)
    .addField("Version", package.version.toString(), true)
    .addField("Uptime", getTime(client.uptime), true)
    .addField("Invite Link", "[Invite](https://discordapp.com/api/oauth2/authorize?client_id=546475480614699028&permissions=277028588544&scope=bot)", true)
    .addField("Contact Link", "[GitHub](https://github.com/OhhLoz/Lure)", true)

    interaction.reply
    ({
      embeds: [embed],
      ephemeral: false
    })
  }

  if (commandName == "stop")
  {
    const { voiceChannel } = interaction.user;

    if (!voiceChannel) {
			return interaction.reply('please join a voice channel first!');
    }

    voiceChannel.leave();
  }
});

client.login(process.env.BOT_TOKEN);