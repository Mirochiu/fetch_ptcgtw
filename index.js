const process = require('process');
const fs = require('fs');
const getCardset = require('./getCardSet');
const getDetailByImgurUrl = require('./getDetailByImgurUrl')
const { downloadFile } = require('./utils')
const searchByCardName = require('./searchByCardName')

const CMD_ARGS = process.argv.slice(2)
console.debug(CMD_ARGS)

const CardObject2Name = (o) => {
    return {
        '張數': o['張數'],
        '類型': o.card_type, // 寶可夢,物品,裝備,支援者,競技場
        '環境': o.set_stand,
        '系列': o.set_name,
        '編號': o.set_no,
        '卡名': o.name, // 有時候名稱不完整,
    }
}

const downloadImgsforCardSet = async (cardSetNumber) => {
    const cardSet = await getCardset(cardSetNumber)

    const num = Object.keys(cardSet).length
    if (num <= 0)
        throw new Error('cardset empty')

    console.debug('imgs in cardset:', num);

    if (!fs.existsSync(cardSetNumber))
        fs.mkdirSync(cardSetNumber, { recursive: true });

    for await (const [url, o] of Object.entries(cardSet)) {
        // console.debug(url, o.name)
        downloadFile(url, { debugName: o.name, dirName: cardSetNumber })
            .then(downloaded => {
                // 只有第一次下載的時候,會去檢查是否這個圖片有細節可用,這會影響到之後名稱,搜尋進化鏈的功能運作
                // 奶爸網站因為有很多版本,有些圖也是會暫時先上去,而之後會改
                if (downloaded)
                    getDetailByImgurUrl(url).then(detail => {
                        if (!detail.name || detail.name != o.name) {
                            console.error(`[WARNING]no detail for card ${o.name} ${url}`)
                        }
                    })
            })
    }

    console.log('done')
}

const main = async () => {
    switch (CMD_ARGS[0]) {
        case '-d':
            {
                await downloadImgsforCardSet(CMD_ARGS[1])
                break
            }
        case '-s':
            {
                const list = await searchByCardName(CMD_ARGS[1])
                console.debug(list.length)
                if (list.length < 20) {
                    console.log('嘗試取回卡片名稱...')
                    for await(const o of list) {
                        const detail = await getDetailByImgurUrl(o.full)
                        console.log(`${detail.name} \t\t ${detail.set_name} \t ${o.full}`)
                    }
                } else {
                    console.log('太多筆資料,不嘗試取回卡片名稱')
                }
                break
            }
        default:
            console.error('usage: -d for download imgs with card set id; -s for search card with name')
    }
}
main()
