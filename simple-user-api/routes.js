const Router = require('@koa/router');
const Users = require('./controllers/users');

const router = new Router();

router.get('/', (ctx) => {
    ctx.body = 'The example server of SQL Injection is running!'
});

router.get('/init', Users.init);

router.get('/users', Users.showAllUsers);

router.get('/user', Users.showUserInfo);

router.get('/user_new1', Users.showUserInfoNew1);

router.get('/user_new2', Users.showUserInfoNew2);

router.get('/hash-password', Users.hashPassword);

router.get('/verify-password', Users.verifyPassword);

module.exports = router;
