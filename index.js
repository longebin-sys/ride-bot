const TelegramBot = require('node-telegram-bot-api');
const db = require('./database');

const {
  requestRide,
  setFare,
  addTip,
  registerDriver,
  goOnline,
  goOffline,
  updateDriverLocation,
  acceptRide,
  pickedUp,
  completeRide
} = require('./handlers');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set!');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🚗 RideBot running on GitHub!');

// Global storage for rider pickup location
global.pickupLocation = null;
global.pickupAddress = null;

// ==================== WELCOME ====================

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `
🚗 Welcome to RideBot!

📱 RIDERS:
1. Share your pickup location (📎 → Location)
2. Then send: RIDE [dropoff]
Example: RIDE 456 Oak Ave

💰 Choose fare when prompted
💡 Add tip if no drivers accept

🚕 DRIVERS:
/register [name] "[vehicle]" [plate]
Example: /register John "Toyota Camry" XYZ123

/online - Go online (share location)
/offline - Go offline
/accept [ride_id] - Accept ride
/pickedup [ride_id] - Picked up
/done [ride_id] - Complete ride
  `);
});

// ==================== LOCATION ====================

bot.on('location', async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const { latitude, longitude } = msg.location;

  const driver = db.getDriver(telegramId);
  if (driver) {
    await updateDriverLocation(bot, chatId, telegramId, latitude, longitude);
    return;
  }

  global.pickupLocation = { lat: latitude, lng: longitude };
  global.pickupAddress = 'Shared location';

  await bot.sendMessage(chatId, `
📍 Pickup location saved!

Now tell me dropoff:
RIDE [address]
Example: RIDE 456 Oak Ave
  `);
});

// ==================== RIDER ====================

bot.onText(/^RIDE\s+(.+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const dropoff = match[1].trim();

  if (!global.pickupLocation) {
    await bot.sendMessage(chatId, '❌ Share pickup location first (📎 → Location)');
    return;
  }

  await requestRide(
    bot,
    chatId,
    telegramId,
    global.pickupLocation.lat,
    global.pickupLocation.lng,
    global.pickupAddress || 'Shared location',
    dropoff
  );

  global.pickupLocation = null;
  global.pickupAddress = null;
});

bot.onText(/^\/fare\s+([a-zA-Z0-9-]+)\s+([\d.]+)$/, (msg, match) => {
  setFare(bot, msg.chat.id, String(msg.from.id), match[1], match[2]);
});

bot.onText(/^\/tip\s+([a-zA-Z0-9-]+)\s+([\d.]+)$/, (msg, match) => {
  addTip(bot, msg.chat.id, String(msg.from.id), match[1], match[2]);
});

// ==================== DRIVER ====================

bot.onText(/^\/register\s+(.+?)\s+"(.+?)"\s+(.+)$/, (msg, match) => {
  registerDriver(bot, msg.chat.id, String(msg.from.id), match[1], match[2], match[3]);
});

bot.onText(/\/online/, (msg) => {
  goOnline(bot, msg.chat.id, String(msg.from.id));
});

bot.onText(/\/offline/, (msg) => {
  goOffline(bot, msg.chat.id, String(msg.from.id));
});

bot.onText(/^\/accept\s+([a-zA-Z0-9-]+)$/, (msg, match) => {
  acceptRide(bot, msg.chat.id, String(msg.from.id), match[1]);
});

bot.onText(/^\/pickedup\s+([a-zA-Z0-9-]+)$/, (msg, match) => {
  pickedUp(bot, msg.chat.id, String(msg.from.id), match[1]);
});

bot.onText(/^\/done\s+([a-zA-Z0-9-]+)$/, (msg, match) => {
  completeRide(bot, msg.chat.id, String(msg.from.id), match[1]);
});

// ==================== FALLBACK ====================

bot.on('message', (msg) => {
  if (!msg.text) return;
  if (msg.text.startsWith('/')) return;
  if (msg.text.toUpperCase().startsWith('RIDE')) return;
  
  bot.sendMessage(msg.chat.id, `
❓ I didn't understand.

For rides: RIDE [address]
For help: /start
  `);
});

console.log('✅ Bot ready!');