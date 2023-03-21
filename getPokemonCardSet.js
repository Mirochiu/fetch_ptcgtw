const fs = require('fs');
const axios = require('axios').default;
const path = require('path');
const { writeToFile } = require('./utils');
const { JSDOM } = require('jsdom');

const fetchData = async (id) => {
    const url_str = `https://www.pokemon-card.com/deck/confirm.html/deckID/${id}/`

    const rsp = await axios.get(url_str);
    if (rsp.status !== 200)
        throw new Error('http status != 200' + rsp.status);

    if (!rsp.data)
        throw new Error('not found data');

    return rsp.data;
}

const id2type = {
    'deck_pke': '寶可夢', // "ポケモン" pokemon
    'deck_gds': '道具|裝備', // "グッズ" goods
    'deck_sup': '支援者', // "サポート" supporter
    'deck_sta': '競技場', // "スタジアム" stadium
    'deck_ene': '能量', // "エネルギー" energy
    'deck_ajs': '不明',
}

const reParse = (content, re) => {
    let d = [];
    let m;
    while ((m = re.exec(content)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }
        d[m[1]] = m[2];
    }
    return d;
}

const parser = (htmlContent) => {
    const cardName = reParse(htmlContent, /PCGDECK\.searchItemNameAlt\[(\d+)\]='(.+)';/ug);
    const imgUrl = reParse(htmlContent, /PCGDECK\.searchItemCardPict\[(\d+)\]='(.+)';/ug);

    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    let data = {}
    document.querySelectorAll('input[id^=deck_]').forEach((e) => {
        if (!e.value) return;
        const cardType = id2type[e.id]
        e.value.split('-').forEach(info => {
            if (!info) return;
            const [cardIdStr, count] = info.split('_')
            const cardId = parseInt(cardIdStr)
            const url = `https://www.pokemon-card.com${imgUrl[cardId]}`
            data[url] = {
                cardId,
                cardName: cardName[cardId],
                count,
                cardType,
                detail_link: `https://www.pokemon-card.com/card-search/details.php/card/${cardId}/regu/all`,
            }
        })
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
        cardSetInfo = await fetchData(cardSetId)

        if (!no_cache)
            await writeToFile({ fileName, data: cardSetInfo });
    }

    return parser(cardSetInfo)
}

module.exports = main
