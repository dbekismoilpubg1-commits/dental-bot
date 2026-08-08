const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN || '8635968824:AAFWjCew4QK4cbUjH1-qGHKABp0NrgQFdAg';
const PORT = process.env.PORT || 3000;
const MINI_APP_URL = process.env.MINI_APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 1000,
    autoStart: true
  }
});

const app = express();
app.use(express.static(path.join(__dirname, 'mini-app')));
app.use(express.json());

const pricesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'prices.json'), 'utf8'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mini-app', 'index.html'));
});

app.get('/api/prices', (req, res) => {
  res.json(pricesData);
});

app.get('/api/category/:id', (req, res) => {
  const category = pricesData.categories.find(c => c.id === req.params.id);
  if (category) {
    res.json(category);
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

const mainKeyboard = {
  inline_keyboard: [
    [{ text: '📋 Прайс-лист', callback_data: 'price_list' }],
    [{ text: '🦷 Открыть Mini App', web_app: { url: MINI_APP_URL } }],
    [{ text: 'ℹ️ О клинике', callback_data: 'about' }, { text: '📞 Контакты', callback_data: 'contacts' }]
  ]
};

const backKeyboard = {
  inline_keyboard: [
    [{ text: '⬅️ Назад', callback_data: 'back_main' }]
  ]
};

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log(`/start from ${chatId}`);
  const welcomeText = `👋 Добро пожаловать!\n\nЯ бот стоматологической клиники. Помогу вам:\n\n📋 Узнать расценки на услуги\n🦷 Ознакомиться с процедурами\n📞 Связаться с нами\n\nНажмите кнопку ниже или откройте Mini App для просмотра полного прайс-листа.`;

  bot.sendMessage(chatId, welcomeText, {
    reply_markup: mainKeyboard
  }).catch(err => console.error('Send message error:', err));
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '📌 Доступные команды:\n\n/start - Главное меню\n/price - Полный прайс-лист\n/help - Помощь\n\nИспользуйте кнопки ниже для навигации:', {
    reply_markup: mainKeyboard
  });
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  console.log(`Callback: ${data} from ${chatId}`);
  bot.answerCallbackQuery(query.id);

  switch (data) {
    case 'price_list':
      showCategories(chatId, messageId);
      break;
    case 'back_main':
      bot.editMessageText('Выберите действие:', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: mainKeyboard
      }).catch(console.error);
      break;
    case 'about':
      bot.editMessageText('🏥 Наша клиника предлагает полный спектр стоматологических услуг:\n\n✅ Терапия\n✅ Ортопедия\n✅ Хирургия\n✅ Пародонтология\n\nИспользуем современное оборудование и материалы.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: backKeyboard
      }).catch(console.error);
      break;
    case 'contacts':
      bot.editMessageText('📞 Контакты:\n\n📍 Адрес: Алмазарский район, Карасарайский 3\n📱 Телефон: +998 97 707 94 07\n🕐 Режим работы: Пн-Сб 10:00-20:00', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: backKeyboard
      }).catch(console.error);
      break;
    default:
      if (data.startsWith('cat_')) {
        const categoryId = data.replace('cat_', '');
        showCategoryItems(chatId, messageId, categoryId);
      }
  }
});

function showCategories(chatId, messageId) {
  const keyboard = {
    inline_keyboard: pricesData.categories.map(cat => [
      { text: cat.name, callback_data: `cat_${cat.id}` }
    ])
  };
  keyboard.inline_keyboard.push([{ text: '⬅️ Назад', callback_data: 'back_main' }]);

  bot.editMessageText('📋 Выберите категорию:', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: keyboard
  }).catch(console.error);
}

function showCategoryItems(chatId, messageId, categoryId) {
  const category = pricesData.categories.find(c => c.id === categoryId);
  if (!category) return;

  let text = `${category.name}\n\n`;
  category.items.forEach((item, index) => {
    text += `${index + 1}. ${item.name}\n   💰 ${item.price}\n\n`;
  });

  const keyboard = {
    inline_keyboard: [
      [{ text: '⬅️ К категориям', callback_data: 'price_list' }],
      [{ text: '🏠 Главное меню', callback_data: 'back_main' }]
    ]
  };

  bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: keyboard
  }).catch(console.error);
}

bot.onText(/\/price/, (msg) => {
  const chatId = msg.chat.id;
  let text = '📋 *ПРАЙС-ЛИСТ*\n\n';
  pricesData.categories.forEach(category => {
    text += `${category.name}\n`;
    category.items.forEach(item => {
      text += `• ${item.name} — ${item.price}\n`;
    });
    text += '\n';
  });
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && text.startsWith('/')) return;

  if (text) {
    bot.sendMessage(chatId, 'Выберите действие из меню ниже:', {
      reply_markup: mainKeyboard
    }).catch(console.error);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`✅ Бот запущен и слушает сообщения...`);
  console.log(`\n📱 Откройте @ClinicDentall_bot в Telegram и нажмите /start\n`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
