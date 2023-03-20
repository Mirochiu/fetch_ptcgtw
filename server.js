const express = require('express');
const morgan = require('morgan');
const path = require('path')
const eta = require('eta')

const getCardSet = require('./getCardSet')

const appConfig = {
    debug: true,
    DIR_NAME: path.join(__dirname, 'public'),
    CardsetCacheDir: path.join(__dirname, 'cardsets'),
    CardsetNameRule: new RegExp('^[a-zA-Z]{2}[0-9]{4}$'),
};

const app = express();

app.disable('x-powered-by'); // security issue
if (appConfig.debug) {
    app.use(morgan("dev"));
} else {
    app.use(morgan("tiny"));
}

app.use('/', express.static(appConfig.DIR_NAME))

app.engine("eta", eta.renderFile);
app.set("view engine", "eta");
app.set("views", "./views");

app.get('/', function (req, res) {
    res.status(200).send('hello, it works').end()
})

app.get('/cardset/:cardSetId', async (req, res) => {
    const { cardSetId } = req.params
    if (!appConfig.CardsetNameRule.test(cardSetId)) {
        res.status(400).send(`牌組號碼格式錯誤 ${cardSetId}`).end()
        return
    }
    const info = await getCardSet(cardSetId, { cache_dir: appConfig.CardsetCacheDir })
    let data = []
    for await (const [url, o] of Object.entries(info)) {
        data.push({
            imgUrl: url,
            cardName: o.name,
            count: o['張數'],
        })
    }
    return res.render('cardset', { cardSetId, cardSetInfo: data });
})

app.get('/cardset/:cardSetId/pdf', async (req, res) => {
    const { cardSetId } = req.params
    if (!appConfig.CardsetNameRule.test(cardSetId)) {
        res.status(400).send(`牌組號碼格式錯誤 ${cardSetId}`).end()
        return
    }
    const info = await getCardSet(cardSetId, { cache_dir: appConfig.CardsetCacheDir })
    let data = []
    for await (const [url, o] of Object.entries(info)) {
        data.push({
            imgUrl: url,
            cardName: o.name,
            count: o['張數'],
        })
    }
    return res.render('pdf', { cardSetId, cardSetInfo: data });
})

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});