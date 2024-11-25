const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const views = require('koa-views');
const router = require('./routes');

const app = new Koa();

// Middleware
app.use(bodyParser());
app.use(views(__dirname + '/views', {
  extension: 'html',
  map: {
    html: 'ejs'
  }
}));

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
  }
});

// Routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 