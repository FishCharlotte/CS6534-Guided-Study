const { initDatabase, getUsers, getUserInfo, getUserInfoNew } = require('../db');
const bcrypt = require('bcrypt');

const init = async (ctx) => {
    await initDatabase();

    ctx.body = {
        msg: 'ok',
    };
};

const showAllUsers = async (ctx) => {
    ctx.body = await getUsers();
};

const showUserInfo = async (ctx) => {
    try {
        const res = await getUserInfo(ctx.request.query.id);
        if (!res) {
            ctx.status = 404;
            ctx.body = { msg: 'user is not found' };
            return;
        }

        // hide phone
        res.phone = res.phone[0] + '***' + res.phone[res.phone.length - 1]

        ctx.body = {
            msg: 'ok',
            data: res,
        }
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = { msg: 'db error' };
    }
};

const showUserInfoNew1 = async (ctx) => {
    try {
        const res = await getUserInfoNew(ctx.request.query.id);
        if (!res) {
            ctx.status = 404;
            ctx.body = { msg: 'user is not found' };
            return;
        }

        // hide phone
        res.phone = res.phone[0] + '***' + res.phone[res.phone.length - 1]

        ctx.body = {
            msg: 'ok',
            data: res,
        }
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = { msg: 'db error' };
    }
};

const showUserInfoNew2 = async (ctx) => {
    // Verify the id parameter
    // It must be a positive whole number
    if (/^\d+$/.test(ctx.request.query.id) === false) {
        ctx.status = 404;
        ctx.body = { msg: 'user is not found' };
        return;
    }

    try {
        const res = await getUserInfo(ctx.request.query.id);
        if (!res) {
            ctx.status = 404;
            ctx.body = { msg: 'user is not found' };
            return;
        }

        // hide phone
        res.phone = res.phone[0] + '***' + res.phone[res.phone.length - 1]

        ctx.body = {
            msg: 'ok',
            data: res,
        }
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = { msg: 'db error' };
    }
};

// Password hashing method
async function hashPassword(ctx) {
    try {
        const { password } = ctx.request.query;
        
        if (!password) {
            ctx.status = 400;
            ctx.body = { error: 'Password is required' };
            return;
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        ctx.body = {
            success: true,
            hashedPassword
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Error during password hashing' };
    }
}

// Password verification method
async function verifyPassword(ctx) {
    try {
        const { password, hashedPassword } = ctx.request.query;
        
        if (!password || !hashedPassword) {
            ctx.status = 400;
            ctx.body = { error: 'Both password and hashed password are required' };
            return;
        }

        const isMatch = await bcrypt.compare(password, hashedPassword);

        ctx.body = {
            success: true,
            isMatch
        };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: 'Error during password verification' };
    }
}

module.exports = {
    init,
    showAllUsers,
    showUserInfo,
    showUserInfoNew1,
    showUserInfoNew2,
    hashPassword,
    verifyPassword
};
