const fs = require('mz/fs');
const Koa = require('koa');
const Router = require('koa-router');
const rangomstring = require('randomstring');
const bodyParser = require('koa-bodyparser');

const takeScreenshot = require('./pageScreenshot.js');

let app = new Koa();
let router = new Router();

let formError = (err) => {
    return {
        ok: false,
        error: err
    }
};

router
    .post('/add', async ctx => {
        if (ctx.request.body.data.length < 6) {
            ctx.body = JSON.stringify(formError('Too short (<6 chars)'));
            return
        }
        let id = rangomstring.generate(5);
        await fs.writeFile('files/'+id, ctx.request.body.data);
        ctx.body = JSON.stringify({
            ok: true,
            id: id
        });
        takeScreenshot(id);
    })
    .get('/:id', async ctx => {
        console.log(ctx.request.header['user-agent']);
        let id = ctx.path.substring(1);
        let ua = ctx.request.header['user-agent'];
        if (ua.startsWith('TelegramBot') || ua.match('vkShare')) {
            ctx.type = 'image/png';
            ctx.body = await fs.readFile(`./img/${id}.png`, 'utf8')
        }
        else {
            await fs.readFile('files/' + id, 'utf8')
                .then(data => ctx.body = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Math #${id}</title>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML'></script>
</head>
<body>
<p style="font-size: 2rem" id="math">$$${data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}$$</p>
</body>
</html>`
                )
                .catch(err => ctx.body = 'Not OK')
        }
    });

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${new Date().toLocaleString()}: ${ctx.method} ${ctx.url} - ${ms}`);
});
app
//     .use(async ctx => {
//     if (ctx.path === '/add' && ctx.query.data && ctx.query.dataurl) {
//         if (ctx.query.data.length < 6) {
//             ctx.body = JSON.stringify(formError('Too short (<6 chars)'));
//             return
//         }
//         let id = rangomstring.generate(5);
//         await Promise.all([
//             fs.writeFile('files/'+id, ctx.query.data),
//             fs.writeFile('img/'+id, ctx.query.dataurl)
//         ])
//             .then(err => {
//                 console.log(err)
//                 ctx.body = JSON.stringify({
//                     ok: true,
//                     id: id
//                 })
//             })
//     }
//     else {
//         console.log(ctx.request.header['user-agent']);
//         let id = ctx.path.substring(1);
//         if (ctx.request.header['user-agent'].startsWith('TelegramBot')) {
//             ctx.type = 'image/png';
//             let dataurl = await fs.readFile('img/' + id, 'utf8');
//             ctx.body = parseDataURL(dataurl).body
//         }
//         else {
//             await fs.readFile('files/' + id, 'utf8')
//                 .then(data => ctx.body = `
// <!DOCTYPE html>
// <html lang="ru">
// <head>
//     <meta charset="UTF-8">
// 	  <meta name="viewport" content="width=device-width, initial-scale=1">
//     <title>Math #${id}</title>
//     <script src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML'></script>
// </head>
// <body>
// <p style="font-size: 2rem" id="math">$$${data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}$$</p>
// </body>
// </html>`
//                 )
//                 .catch(err => ctx.body = 'Not OK')
//         }
//     }
// })
    .use(bodyParser())
    .use(router.routes());

app.listen(1001);