const jwt = require('jsonwebtoken');
const Accounts = require('../data/accounts.json');

const login = async (ctx) => {
    const { username, password } = ctx.request.body;
    if (username === undefined || password === undefined) {
        throw new Error('Invalid username or password');
    }

    const account = Accounts.find((v) => {
        return v['username'] === username;
    });

    if (!account || account['password'] !== password) {
        throw new Error('Invalid username or password');
    }

    const token = jwt.sign({ username: username, exp: Math.floor(Date.now() / 1000) + parseInt(process.env['JWT_EXP']) }, process.env['JWT_KEY']);

    ctx.body = {
        msg: 'ok',
        token: token,
    }
};
const showUserInfo = async (ctx) => {
    // Authorization
    try {
        jwt.verify(ctx.request.headers['x-token'] || '', process.env['JWT_KEY']);
    } catch (e) {
        throw new Error('Please log in!');
    }

    // Get user info
    const { username } = ctx.request.params;

    ctx.body = {
        msg: 'ok',
        info: Accounts.find((v) => {
            return v['username'] === username;
        }),
    }
}

const showUserInfoNew = async (ctx) => {
    try {
        const decoded = jwt.verify(ctx.request.headers['x-token'] || '', process.env['JWT_KEY']);

        ctx.body = {
            msg: 'ok',
            username: decoded.username,
        }
    } catch (e) {
        throw new Error('Please log in!');
    }
}

module.exports = {
    login,
    showUserInfo,
    showUserInfoNew,
};
