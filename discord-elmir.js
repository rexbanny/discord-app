require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const {
    joinVoiceChannel,
    getVoiceConnection,
    EndBehaviorType,
    createAudioPlayer,
    createAudioResource,
    StreamType
} = require('@discordjs/voice');
const { GoogleGenAI } = require('@google/genai');
const WebSocket = require('ws');
const prism = require('prism-media');
const { Readable } = require('stream');

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

// Gemini Live API-yə qoşulmaq və səsi idarə etmək üçün funksiya
function setupLiveGemini(connection) {
    const URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${process.env.GEMINI_API_KEY}`;
    const ws = new WebSocket(URL);

    const audioPlayer = createAudioPlayer();
    connection.subscribe(audioPlayer);

    const geminiAudioStream = new Readable({ read() { } });
    const resource = createAudioResource(geminiAudioStream, { inputType: StreamType.Raw });
    audioPlayer.play(resource);

    ws.on('open', () => {
        console.log('Gemini Live WebSocket-ə qoşuldu.');
        // Setup mesajını göndəririk
        ws.send(JSON.stringify({
            setup: {
                model: "models/gemini-2.0-flash-exp",
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
                }
            }
        }));
    });

    ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        // Gemini-dən gələn səsi Discord-a yönəldirik
        if (response.serverContent?.modelTurn?.parts) {
            for (const part of response.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                    const buffer = Buffer.from(part.inlineData.data, 'base64');
                    geminiAudioStream.push(buffer);
                }
            }
        }
    });

    // İstifadəçi danışanda səsini tutub Gemini-yə göndəririk
    connection.receiver.speaking.on('start', (userId) => {
        const opusStream = connection.receiver.subscribe(userId, {
            end: { behavior: EndBehaviorType.AfterSilence, duration: 100 }
        });

        const pcmDecoder = new prism.opus.Decoder({ frameSize: 960, channels: 1, rate: 16000 });
        const pcmStream = opusStream.pipe(pcmDecoder);

        pcmStream.on('data', (chunk) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: "audio/pcm;rate=16000",
                            data: chunk.toString('base64')
                        }]
                    }
                }));
            }
        });
    });

    // Əlaqə kəsiləndə WebSocket-i bağlayırıq
    connection.on('stateChange', (oldState, newState) => {
        if (newState.status === 'destroyed' || newState.status === 'disconnected') {
            ws.close();
        }
    });
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === 'salam' || message.content === 'Salam' || message.content === 'sa') {
        return message.reply('Allahım yene geldi');
    }

    if (message.content === '!qoşul') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('you must be in a voice channel to use this command! 🎤');
        }
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: false // Səsi eşitməsi üçün karlar rejimini söndürürük
            });

            // WebSocket səs inteqrasiyasını başladırıq
            setupLiveGemini(connection);

            message.reply(`"${voiceChannel.name}" gəldim hocam. Mənə səsli nəsə de!`);
        } catch (error) {
            console.error(error);
            message.reply('geri zekalımısın bir səsli söhbətə gir ondan sonra meni çağır');
        }
    }

    if (message.content === '!çıx') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply('Ohh be sonunda');
        } else {
            message.reply('You are not in a voice channel.');
        }
    }

    // Orijinal Mətn-əsaslı AI yanıtı hissəsi (DM və Mention üçün)
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