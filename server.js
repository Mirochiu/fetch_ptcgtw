const express = require('express');
const morgan = require('morgan');
const path = require('path')
const eta = require('eta')
const fs = require('fs')

const getCardSet = require('./getCardSet')
const getOfficialCardSet = require('./getOfficialCardSet')
const { downloadFile } = require('./utils')

const appConfig = {
    debug: true,
    DIR_NAME: path.join(__dirname, 'public'),
    CardsetCacheDir: path.join(__dirname, 'cardsets'),
    CardsetNameRule: new RegExp('^[a-zA-Z]{2}[0-9]{4}$'),
    OfficialCardsetNameRule: new RegExp('^[a-zA-Z0-9]{6}-[a-zA-Z0-9]{6}-[a-zA-Z0-9]{6}$'),
    IMG_CACHE_DIR: path.join(__dirname, 'img_cache') || './',
    IMG_CACHE_STATIC_ROUTE: '/static/cached_imgs',
};

if (!fs.existsSync(appConfig.IMG_CACHE_DIR))
    fs.mkdirSync(appConfig.IMG_CACHE_DIR, { recursive: true });

const app = express();

app.disable('x-powered-by'); // security issue
if (appConfig.debug) {
    app.use(morgan("dev"));
} else {
    app.use(morgan("tiny"));
}

app.use('/', express.static(appConfig.DIR_NAME))
app.use(appConfig.IMG_CACHE_STATIC_ROUTE, express.static(appConfig.IMG_CACHE_DIR))

app.engine("eta", eta.renderFile);
app.set("view engine", "eta");
app.set("views", "./views");

const cacheImg = async (url) => {
    if (!url)
        return url;

    if (!url.startsWith('https://asia.pokemon-card.com/'))
        return url;

    const { fileName } = await downloadFile(url, { dirName: appConfig.IMG_CACHE_DIR })
    return appConfig.IMG_CACHE_STATIC_ROUTE + '/' + fileName
}

const officialCardsetInfo2render = async (info) => {
    let data = []
    for await (const [url, o] of Object.entries(info)) {
        data.push({
            imgUrl: await cacheImg(url),
            cardName: o.cardName,
            count: o.count,
        })
    }
    return data;
}

const checkOfficialCardSetId = (req, res, next) => {
    const { cardSetId } = req.params
    if (!appConfig.OfficialCardsetNameRule.test(cardSetId)) {
        res.status(400).send(`牌組號碼格式錯誤 ${cardSetId}`).end()
        return
    }
    next();
}

// officialcardset
app.get('/officialcardset/:cardSetId', checkOfficialCardSetId, async (req, res) => {
    const { cardSetId } = req.params
    const info = await getOfficialCardSet(cardSetId, { cache_dir: appConfig.CardsetCacheDir })
    const cardSetInfo = await officialCardsetInfo2render(info)
    return res.render('cardset', { cardSetId, cardSetInfo });
})

app.get('/officialcardset/:cardSetId/pdf', checkOfficialCardSetId, async (req, res) => {
    const { cardSetId } = req.params
    const info = await getOfficialCardSet(cardSetId, { cache_dir: appConfig.CardsetCacheDir })
    const cardSetInfo = await officialCardsetInfo2render(info)
    return res.render('pdf', { cardSetId, cardSetInfo });
})

const PtcgtwCardSetInfo2render = async (info) => {
    let data = []
    for await (const [url, o] of Object.entries(info)) {
        data.push({
            imgUrl: url,
            cardName: o.name,
            count: o['張數'],
        })
    }
    return data;
}

const checkPtcgtwCardSetId = (req, res, next) => {
    const { cardSetId } = req.params
    if (!appConfig.CardsetNameRule.test(cardSetId)) {
        res.status(400).send(`牌組號碼格式錯誤 ${cardSetId}`).end()
        return
    }
    next();
}

app.get('/cardset/:cardSetId', checkPtcgtwCardSetId, async (req, res) => {
    const { cardSetId } = req.params
    const info = await getCardSet(cardSetId, { cache_dir: appConfig.CardsetCacheDir })
    const cardSetInfo = PtcgtwCardSetInfo2render(info)
    return res.render('cardset', { cardSetId, cardSetInfo });
})

app.get('/cardset/:cardSetId/pdf', checkPtcgtwCardSetId, async (req, res) => {
    const { cardSetId } = req.params
    const info = await getCardSet(cardSetId, { cache_dir: appConfig.CardsetCacheDir })
    const cardSetInfo = PtcgtwCardSetInfo2render(info)
    return res.render('pdf', { cardSetId, cardSetInfo });
})

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});