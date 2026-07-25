require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { GoogleGenAI } = require('@google/genai');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

client.once('ready', () => {
    console.log(`${client.user.tag} onlayndır!`);
});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    if (message.content === '!qoşul') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('you must be in a voice channel to use this command! 🎤');
        }
        try {
            // Səsli kanala qoşulma funksiyası
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            message.reply(`"${voiceChannel.name}" channel joined successfully! 🎧`);
        } catch (error) {
            console.error(error);
            message.reply('you must be in a voice channel to use this command! 🎤');
        }
    }
    if (message.content === '!çıx') {
        const connection = getVoiceConnection(message.guild.id);

        if (connection) {
            connection.destroy();
            message.reply('You have left the voice channel! 👋');
        } else {
            message.reply('You are not in a voice channel.');
        }
    }
    // Botun adının çağırılması və ya DM yoluyla mesaj atılması durumunda AI yanıtı verme
    const isMentioned = message.mentions.has(client.user) && !message.mentions.everyone;
    const isDM = !message.guild;

    if (isMentioned || isDM) {

        let userPrompt = message.content.replace(`<@${client.user.id}>`, '').trim();

        if (!userPrompt) {
            return message.reply('Nevar abi?');
        }


        await message.channel.sendTyping();

        try {

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,

                config: {
                    systemInstruction: "You are a friendly, helpful, and interesting Discord chat bot. Keep your responses short, interesting, and friendly."
                }
            });

            const aiReply = response.text;


            if (aiReply.length > 2000) {
                return message.reply(aiReply.substring(0, 1990) + '...');
            }


            await message.reply(aiReply);

        } catch (error) {
            console.error('AI Error:', error);
            await message.reply('Sorry, my brain is a bit scrambled. You can try again in a bit? 😵‍💫');
        }
    }

});

client.login(process.env.DISCORD_TOKEN);