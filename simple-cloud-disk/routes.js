const Router = require('@koa/router');
const Users = require('./controllers/users');
const Files = require('./controllers/files');

const router = new Router();

router.get('/', (ctx) => {
    ctx.body = 'The example server of Broken Access Control is running!'
});

router.post('/auth/login', Users.login);

router.get('/users/:username', Users.showUserInfo);

router.get('/users', Users.showUserInfoNew);

router.get('/files', Files.showFiles);

router.get('/files/:username/:filename', Files.downloadFile);

router.get('/files2/:username/:filename', Files.downloadFile2);

router.get('/download-remote', Files.downloadRemoteFile);

router.get('/download-remote2', Files.downloadRemoteFile2);

router.get('/download-remote3', Files.checkReferer, Files.downloadRemoteFile2);

router.get('/leak', async (ctx) => {
    ctx.body = 'This is a leak page';
});

router.get('/download4', Files.generateCsrfToken, async (ctx) => {
    await ctx.render('download4', { csrfToken: ctx.state.csrfToken });
});

router.get('/download-remote4', Files.verifyCsrfToken, Files.downloadRemoteFile2);

module.exports = router;
