const fs = require('fs');
const axios = require('axios').default;
const path = require('path');
const { writeToFile } = require('./utils');
const { JSDOM } = require('jsdom');

const getFromAsiaPokemonCard = async (id) => {
    const url_str = `https://asia.pokemon-card.com/tw/deck-build/recipe/${id}/`

    const rsp = await axios.get(url_str);
    if (rsp.status !== 200)
        throw new Error('http status != 200' + rsp.status);

    if (!rsp.data)
        throw new Error('not found data');

    return rsp.data;
}

const officialCardSetParser = (htmlContent) => {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    let data = {}
    document.querySelectorAll('div.textList li.card').forEach((e) => {
        const info = e.querySelector('div.cardData')
        const count = parseInt(e.querySelector('div.cardCount').textContent.trim())
        const a = info.querySelector('a[href]');
        const detail_link = a.getAttribute('href')
        const name = a.textContent.trim()
        const series = info.querySelector('span.cardExpansion').textContent.trim()
        const no = info.querySelector('span.cardNumber').textContent.trim()
        const imgUrl = document.querySelector(`a[href="${detail_link}"] img[data-original]`).getAttribute('data-original')

        data[imgUrl] = {
            cardName: name,
            count,
            set_no: no,
            set_name: series,
            detail_link,
        }
    })

    return data
}

const main = async (cardSetId, opt = {}) => {
    if (typeof cardSetId !== 'string' || !cardSetId)
        throw new Error('你需要給予牌組ID才能取回');

    const { force = false, cache_dir = './', no_cache = false } = opt;

    if (!fs.existsSync(cache_dir))
        fs.mkdirSync(cache_dir, { recursive: true });

    const fileName = path.join(cache_dir, `${cardSetId}.txt`);

    let cardSetInfo

    if (!force && fs.existsSync(fileName)) {
        cardSetInfo = fs.readFileSync(fileName).toString();
    } else {
        cardSetInfo = await getFromAsiaPokemonCard(cardSetId)

        if (!no_cache)
            await writeToFile({ fileName, data: cardSetInfo });
    }

    return officialCardSetParser(cardSetInfo)
}

module.exports = main
