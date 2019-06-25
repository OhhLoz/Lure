from discord.ext import commands
import json
with open('config.json') as f:
    config = json.load(f)

bot = commands.Bot(command_prefix=config["prefix"])

@bot.event
async def on_ready():
    print('We have logged in as {0.user}'.format(bot))


@bot.command()
async def ping(ctx):
    '''
    This text will be shown in the help command
    '''

    # Get the latency of the bot
    latency = bot.latency  # Included in the Discord.py library
    # Send it to the user
    await ctx.send(latency)


@bot.command()
async def echo(ctx, *, content:str):
    await ctx.send(content)


bot.run(config["token"])  # Where 'TOKEN' is your bot token