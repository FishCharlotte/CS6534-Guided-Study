const Router = require('@koa/router');
const Messages = require('./controllers/messages');

const router = new Router();

// Homepage
router.get('/', async (ctx) => {
  await ctx.render('index');
});

// New message page
router.get('/new', async (ctx) => {
  await ctx.render('new');
});

// Get message list
router.get('/api/messages', Messages.getMessages);

// Create new message
router.post('/api/messages', Messages.createMessage);

// Preview pages
router.get('/preview', Messages.previewMessage);
router.get('/preview2', Messages.previewMessage2);

module.exports = router; 