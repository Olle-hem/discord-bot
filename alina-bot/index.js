const { Client, GatewayIntentBits, Events } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

const reminders = [];

client.once(Events.ClientReady, () => {
  console.log(`✅ Botten är inloggad som ${client.user.tag}`);

  setInterval(() => {
    const now = new Date();

    reminders.forEach((reminder, index) => {
      if (now <= reminder.date) {
        const channel = client.channels.cache.get(reminder.channelId);
        if (channel) {
          channel.send({
            content: `<@${reminder.userId}> Påminnelse: ${reminder.message}`,
            files: reminder.imageUrl ? [reminder.imageUrl] : [],
          });
        }
      } else {
        // Ta bort gamla påminnelser
        reminders.splice(index, 1);
      }
    });
  }, 10 * 60 * 60 * 1000); // var 10:e timme
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!påminn')) {
    const parts = message.content.split(' ');
    if (parts.length < 3) {
      return message.channel.send('❌ Använd format: `!påminn YYYY-MM-DD Meddelande` (du kan bifoga en bild)');
    }

    const dateString = parts[1];
    const reminderMessage = parts.slice(2).join(' ');
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return message.channel.send('❌ Ogiltigt datum. Använd formatet `YYYY-MM-DD`.');
    }

    if (date <= new Date()) {
      return message.channel.send('❌ Datumet måste vara i framtiden.');
    }

    // Hämta första bilagans URL om det är en bild
    let imageUrl = null;
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      if (imageTypes.includes(attachment.contentType)) {
        imageUrl = attachment.url;
      }
    }

    reminders.push({
      userId: message.author.id,
      channelId: message.channel.id,
      date,
      message: reminderMessage,
      imageUrl
    });

    message.channel.send(
      `✅ Påminnelse sparad till ${date.toDateString()}` + (imageUrl ? ' med bild 📸' : '')
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
