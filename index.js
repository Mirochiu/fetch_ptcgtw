const process = require('process');
const fs = require('fs');
const getCardset = require('./getCardSet');
const getDetailByImgurUrl = require('./getDetailByImgurUrl')
const { downloadFile } = require('./utils')
const searchByCardName = require('./searchByCardName')

const CMD_ARGS = process.argv.slice(2)

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

const main = async () => {
    switch (CMD_ARGS[0]) {
        case '-d':
            {
                const cardSetId = CMD_ARGS[1]
                console.log(`get card set ${cardSetId} from Ptcg.tw shop`)
                const cardSet = await getCardset(cardSetId)
                const num = Object.keys(cardSet).length
                if (num <= 0)
                    throw new Error('無資料,無法處理牌組')

                if (!fs.existsSync(cardSetId))
                    fs.mkdirSync(cardSetId, { recursive: true });

                for await (const [url, o] of Object.entries(cardSet)) {
                    downloadFile(url, { debugName: o.name, dirName: cardSetId })
                        .then(downloaded => {
                            // 只有第一次下載的時候,會去檢查是否這個圖片有細節可用,這會影響到之後名稱,搜尋進化鏈的功能運作
                            // 奶爸網站因為有很多版本,有些圖也是會暫時先上去,而之後會改
                            if (downloaded)
                                getDetailByImgurUrl(url).then(detail => {
                                    if (!detail.name || detail.name != o.name) {
                                        console.error(`[警示]沒有卡牌${o.name}的詳細資料,可能是新卡/暫時使用/不再維護的卡片,建議重新編排卡牌 ${url}`)
                                    }
                                })
                        })
                }

                console.log('完成')
                break
            }
        case '-s':
            {
                const cardName = CMD_ARGS[1];
                console.log(`在ptcgtw.shop搜尋卡片:${cardName}`)
                const list = await searchByCardName(cardName)
                if (list.length < 1) {
                    console.log(`沒找到名稱含有'${cardName}'的卡片`)
                    break
                }
                if (list.length > 20) {
                    console.log(`太多搜尋結果${list.length},不嘗試取回卡片名稱`)
                    break
                }
                console.log('嘗試取回卡片名稱...')
                for await (const o of list) {
                    const detail = await getDetailByImgurUrl(o.full)
                    console.log(`${detail.name} \t\t ${detail.set_name} \t ${o.full}`)
                }
                break
            }
        default:
            console.error('usage:')
            console.error('  -d <card-set-id>   download imgs with card set id')
            console.error('  -s [<target name>] search card with name')
    }
}
main()
