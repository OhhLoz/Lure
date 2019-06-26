const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const snekfetch = require('snekfetch');

const config = require("./config.json");
const clipsDict = require("./clips.json");
const redditDict = require("./reddit.json");

const versionNumber = "1.0.0";

const redditPrefix = "https://www.reddit.com"


client.on("ready", () =>
{
  console.log(`Lure is currently serving ${client.users.filter(user => !user.bot).size} users, in ${client.channels.size} channels of ${client.guilds.size} servers. Alongside ${client.users.filter(user => user.bot).size} bot brothers.`);
  client.user.setActivity(`use .lure`);
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

  // VOICE COMMANDS
  if (command == "clip")
  {
    if(args.length == 0)
    {
      return message.channel.send("Please enter a valid clip to play, use .clips for a list");
    }
    else
    {
      var clip = clipsDict[args[0]];
      if (clip == undefined)
        return message.channel.send("Please enter a valid clip to play, use .clips for a list");

        const { voiceChannel } = message.member;

        if (!voiceChannel) {
          return message.reply('please join a voice channel first!');
        }
        voiceChannel.join().then(connection =>
        {
          const stream = ytdl(clip, { filter: 'audioonly' });
          const dispatcher = connection.playStream(stream);
          dispatcher.on('end', () => voiceChannel.leave());
        });
    }
  }

  if (command == "clips")
  {
    var outputMsg = "";
    var count = 1;
    for (var tempKey in clipsDict)
    {
      outputMsg += tempKey;
      if(count != Object.keys(clipsDict).length)
        outputMsg += ", ";
      count++;
    }
    message.channel.send(outputMsg);
  }

  if (command == "stop")
  {
    const { voiceChannel } = message.member;

    if (!voiceChannel) {
			return message.reply('please join a voice channel first!');
    }

    voiceChannel.leave();
  }

  // Preset image subreddits
  if (command == "dank" || command == "memes")
  {
      var time = "week";
      if (args.length == 1)
        time = args[0];

      const { body } = await snekfetch
          .get('https://www.reddit.com/r/'+ redditDict[command] +'.json?sort=top&t=' + time)
          .query({ limit: 800 });
      const allowed = message.channel.nsfw ? body.data.children : body.data.children.filter(post => !post.data.over_18);
      if (!allowed.length) return message.channel.send('It seems we are out of fresh memes!, Try again later.');
      const randomnumber = Math.floor(Math.random() * allowed.length)
      const embed = new Discord.RichEmbed()
      .setColor(0x00A2E8)
      .setURL(redditPrefix + allowed[randomnumber].data.permalink)
      .setTitle(allowed[randomnumber].data.title)
      .setDescription("Posted by: " + allowed[randomnumber].data.author)
      .setImage(allowed[randomnumber].data.url)
      .addField("Other info:", "Upvotes: " + allowed[randomnumber].data.ups + " / Comments: " + allowed[randomnumber].data.num_comments)
      .setFooter("Memes provided by " + allowed[randomnumber].data.subreddit_name_prefixed)
      message.channel.send(embed)
  }

  // custom search reddits (post/image)
  if (command == "reddit")
  {
    var time = "week";
    if (args.length == 0)
      message.channel.send("I need a subreddit to look in! try .lure for help")
    else if(args[0] == "image")
    {
      if (args[2] != null)
        time = args[2];
      const { body } = await snekfetch
      .get('https://www.reddit.com/r/'+ args[1] +'.json?sort=top&t=' + time)
      .query({ limit: 800 });

      const allowed = message.channel.nsfw ? body.data.children : body.data.children.filter(post => !post.data.over_18 && !post.data.is_video && post.data.thumbnail != "self");
      if (!allowed.length) return message.channel.send('It seems we are out of fresh posts!, Try again later.');
      const randomnumber = Math.floor(Math.random() * allowed.length)
      const embed = new Discord.RichEmbed()
      .setColor(0x00A2E8)
      .setURL(redditPrefix + allowed[randomnumber].data.permalink)
      .setTitle(allowed[randomnumber].data.title)
      .setDescription("Posted by: " + allowed[randomnumber].data.author)
      .setImage(allowed[randomnumber].data.url)
      .addField("Other info:", "Upvotes: " + allowed[randomnumber].data.ups + " / Comments: " + allowed[randomnumber].data.num_comments)
      .setFooter("Post provided by " + allowed[randomnumber].data.subreddit_name_prefixed)
      message.channel.send(embed)
    }
    else if (args[0] == "post")
    {
      if (args[2] != null)
        time = args[2];
      const { body } = await snekfetch
      .get('https://www.reddit.com/r/'+ args[1] +'.json?sort=top&t=' + time)
      .query({ limit: 800 });

      const allowed = message.channel.nsfw ? body.data.children : body.data.children.filter(post => !post.data.over_18 && !post.data.is_video && post.data.media == null && !post.data.media_only && post.data.thumbnail == "self");
      if (!allowed.length) return message.channel.send('It seems we are out of fresh posts!, Try again later.');
      const randomnumber = Math.floor(Math.random() * allowed.length)
      const embed = new Discord.RichEmbed()
      .setColor(0x00A2E8)
      .setURL(redditPrefix + allowed[randomnumber].data.permalink)
      .setTitle(allowed[randomnumber].data.title)
      .setDescription(allowed[randomnumber].data.selftext.substring(0, 2048))
      .addField("Other info:", "Upvotes: " + allowed[randomnumber].data.ups + " / Comments: " + allowed[randomnumber].data.num_comments + " / Author: " + allowed[randomnumber].data.author)
      .setFooter("Post provided by " + allowed[randomnumber].data.subreddit_name_prefixed)
      message.channel.send(embed)
    }
  }
});

client.login(config.token);