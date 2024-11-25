const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const router = require('./routes');
const views = require('koa-views');

const app = new Koa();
app.use(bodyParser());
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = { msg: e.message };
    }
});

app.use(views(__dirname + '/views', {
    extension: 'html',
    map: {
        html: 'ejs'
    }
}));

app
    .use(router.routes())
    .use(router.allowedMethods());


app.listen(8080);
