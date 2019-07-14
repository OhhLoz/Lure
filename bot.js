const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const snekfetch = require('snekfetch');
const enmap = require("enmap");

const config = require("./config.json");
const clipsDict = require("./clips.json");
const redditDict = require("./reddit.json");

const versionNumber = "1.2.6";

const redditPrefix = "https://www.reddit.com";

client.settings = new enmap({
  name:"clips",
  fetchAll: false,
  autoFetch: true,
  cloneLevel: 'deep'
});

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
  var servercount = 0;
  var usercount = 0;
  var botcount = 0;
  var channelcount = 0;
  client.guilds.forEach((guild) =>
  {
    if (guild.id == "264445053596991498")
      return;

    servercount += 1;
    channelcount += guild.channels.filter(channel => channel.type != 'category').size;
    usercount += guild.members.filter(member => !member.user.bot).size;
    botcount += guild.members.filter(member => member.user.bot).size;
  })

  console.log(`Lure is currently serving ${usercount} users, in ${channelcount} channels of ${servercount} servers. Alongside ${botcount} bot brothers.`);
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

  const guildConf = client.settings.ensure(message.guild.id, clipsDict);

  // Separate our command names, and command arguments
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command == "lure")
  {
    if (args.length == 0)
    {
      var embed = new Discord.RichEmbed()
      .setTitle("Help")
      .setColor(0xff8d00)
      .setTimestamp()
      .setFooter("Sent by Lure", client.user.avatarURL)
      .addField(".lure", "Lists all current commands", false)
      .addField(".lure ping", "Displays the current bot latency", false)
      .addField(".lure stats", "Displays bot statistics, invite link and contact information", false)
      .addBlankField()
      .addField(".clip [arg]", "Plays a sound clip in a voice channel")
      .addField(".[clipname]", "Plays the specified clip, alternate command to .clip for faster typing")
      .addField(".clips", "Lists all available sound clips")
      .addField(".addclip [arg1] [arg2]", "Add a clip to the database with name arg1 and source arg2, arg1 = 'default' to add the default clips")
      .addField(".delclip [arg1]", "Deletes the clip with name arg1, arg1 = 'all' to delete all clips, arg1 = 'default' to delete default clips")
      .addBlankField()
      .addField(".dank [arg]", "Displays a random image from r/dankmemes, arg is the time [all, day, week, month, year], default: week")
      .addField(".memes [arg]", "Displays a random image from r/memes, arg is the time [all, day, week, month, year], default: week")
      .addField(".reddit [arg1] [arg2] [arg3]", "arg1 [image, post], arg2 is the subreddit, arg3 is the time [all, day, week, month, year], default: week")
      .addField(".copypasta [arg]", "Displays a random text post from r/copypasta, arg is the time [all, day, week, month, year], default: all")

      message.channel.send(embed);
    }
    else if (args[0] == "ping")
    {
      // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
      // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
      const m = await message.channel.send("Calculating");
      m.edit(`Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
    }
    else if (args[0] == "stats")
    {
      var servercount = 0;
      var usercount = 0;
      var botcount = 0;
      var channelcount = 0;
      client.guilds.forEach((guild) =>
      {
        if (guild.id == "264445053596991498")
          return;
        servercount += 1;
        channelcount += guild.channels.filter(channel => channel.type != 'category').size;
        usercount += guild.members.filter(member => !member.user.bot).size;
        botcount += guild.members.filter(member => member.user.bot).size;
      })
      var embed = new Discord.RichEmbed()
      .setTitle("Bot Stats")
      .setColor(0xff8d00)
      .setTimestamp()
      .setThumbnail(client.user.avatarURL)
      .setFooter("Sent by Lure", client.user.avatarURL)
      .addField("Server Count", servercount, true)
      .addField("Channel Count", channelcount, true)
      .addField("User Count", usercount, true)
      .addField("Bot User Count", botcount, true)
      .addField("Version", versionNumber, true)
      .addField("Uptime", getTime(client.uptime), true)
      .addField("Invite Link", "[Invite](https://discordapp.com/api/oauth2/authorize?client_id=546475480614699028&permissions=3476544&scope=bot)", true)
      .addField("Contact Link", "[GitHub](https://github.com/OhhLoz/Lure)", true)
      message.channel.send(embed);
    }
    else
    {
      message.channel.send("Invalid Command, use .lure for commands");
    }
  }

  // VOICE COMMANDS
  if (command == "clip")
  {
    if(args.length == 0)
    {
      return message.channel.send("Please enter a valid clip to play, use .clips for a list");
    }
    else
    {
      var clip = client.settings.get(message.guild.id, args[0]);
      if (clip == undefined)
        return message.channel.send("Please enter a valid clip to play, use .clips for a list");

      const { voiceChannel } = message.member;

      if (!voiceChannel) {
        return message.reply('please join a voice channel first!');
      }

      message.react('🔊');
      voiceChannel.join().then(connection =>
      {
        const stream = ytdl(clip, { filter: 'audioonly' });
        const dispatcher = connection.playStream(stream);
        dispatcher.on('end', () => voiceChannel.leave());
      });
    }
  }

  if (guildConf.hasOwnProperty(command))
  {
    var clip = client.settings.get(message.guild.id, command);
    if (clip == undefined)
      return message.channel.send("Please enter a valid clip to play, use .clips for a list");

    const { voiceChannel } = message.member;

    if (!voiceChannel) {
      return message.reply('please join a voice channel first!');
    }
    message.react('🔊');
    voiceChannel.join().then(connection =>
    {
      const stream = ytdl(clip, { filter: 'audioonly' });
      const dispatcher = connection.playStream(stream);
      dispatcher.on('end', () => voiceChannel.leave());
    });
  }

  if (command == "addclip") //default
  {
    if (args[0] == "default")
    {
      Object.keys(clipsDict).map(prop => {client.settings.set(message.guild.id, clipsDict[prop], prop)})
      return message.channel.send(`All Default Clips have been added.`);
    }

    if (args.length != 2)
      return message.channel.send("Invalid number of arguments, please use .lure for help")

    client.settings.set(message.guild.id, args[1], args[0]);
    message.channel.send(`Clip ${args[0]} has been added with value: ${args[1]}`);
  }

  if (command == "delclip") //all
  {
    if (args.length != 1)
      return message.channel.send("Invalid number of arguments, please use .lure for help")

    if (args[0] == "all")
    {
      Object.keys(guildConf).map(prop => {client.settings.remove(message.guild.id, prop)})
      return message.channel.send(`All clips have been deleted.`);
    }
    else if (args[0] == "default")
    {
      Object.keys(clipsDict).map(prop => {client.settings.remove(message.guild.id, prop)})
      return message.channel.send(`All Default clips have been deleted.`);
    }

    if(!client.settings.has(message.guild.id, args[0]))
      return message.channel.send("Invalid clip name, please use .clips for a reference")

    client.settings.remove(message.guild.id, args[0]);
    message.channel.send(`Clip ${args[0]} has been deleted.`);
  }

  if (command == "clips")
  {
    var embed = new Discord.RichEmbed()
    .setTitle("Clips")
    .setColor(0xff8d00)
    .setTimestamp()
    .setFooter("Sent by Lure", client.user.avatarURL)

    let configProps = Object.keys(guildConf).map(prop => {
      return ` ${prop}`;
    });

    embed.setDescription(`${configProps}`)
    message.channel.send(embed);
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
      .setTitle(allowed[randomnumber].data.title.substring(0, 256))
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
      .setTitle(allowed[randomnumber].data.title.substring(0, 256))
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
      .setTitle(allowed[randomnumber].data.title.substring(0, 256))
      .setDescription(allowed[randomnumber].data.selftext.substring(0, 2048))
      .addField("Other info:", "Upvotes: " + allowed[randomnumber].data.ups + " / Comments: " + allowed[randomnumber].data.num_comments + " / Author: " + allowed[randomnumber].data.author)
      .setFooter("Post provided by " + allowed[randomnumber].data.subreddit_name_prefixed)
      message.channel.send(embed)
    }
  }

  if (command == "copypasta")
  {
    var time = 'all';
    if (args[2] != null)
      time = args[2];
    const { body } = await snekfetch
    .get('https://www.reddit.com/r/copypasta.json?sort=top&t=all')
    .query({ limit: 800 });

    const allowed = message.channel.nsfw ? body.data.children : body.data.children.filter(post => !post.data.over_18 && !post.data.is_video && post.data.media == null && !post.data.media_only && post.data.thumbnail == "self");
    if (!allowed.length) return message.channel.send('It seems we are out of fresh posts!, Try again later.');
    const randomnumber = Math.floor(Math.random() * allowed.length)
    const embed = new Discord.RichEmbed()
    .setColor(0x00A2E8)
    .setURL(redditPrefix + allowed[randomnumber].data.permalink)
    .setTitle(allowed[randomnumber].data.title.substring(0, 256))
    .setDescription(allowed[randomnumber].data.selftext.substring(0, 2048))
    .addField("Other info:", "Upvotes: " + allowed[randomnumber].data.ups + " / Comments: " + allowed[randomnumber].data.num_comments + " / Author: " + allowed[randomnumber].data.author)
    .setFooter("Post provided by " + allowed[randomnumber].data.subreddit_name_prefixed)
    message.channel.send(embed)
  }
});

client.login(config.token);