const process = require('process');
const fs = require('fs');
const getCardset = require('./getCardSet');
const getDetailByImgurUrl = require('./getDetailByImgurUrl')
const { downloadFile } = require('./utils')
const searchByCardName = require('./searchByCardName')
const getOfficialCardSet = require('./getOfficialCardSet');

const CMD_ARGS = process.argv.slice(2)

const main = async () => {
    switch (CMD_ARGS[0]) {
        case '-a':
            {
                const cardSetId = CMD_ARGS[1]
                console.log(`取出asia.pokemon-card.com的牌組資料:${cardSetId}`)
                try {
                    const cardSet = await getOfficialCardSet(cardSetId)
                    const num = Object.keys(cardSet).length
                    if (num <= 0)
                        throw new Error('無資料,無法處理牌組')
                    if (!fs.existsSync(cardSetId))
                        fs.mkdirSync(cardSetId, { recursive: true });
                    for await (const [url, o] of Object.entries(cardSet)) {
                        console.log(`${o.cardName} \t ${o.count}張 \t ${url}`)
                        downloadFile(url, { debugName: o.cardName, dirName: cardSetId })
                            .then(downloaded => {
                                if (downloaded) console.log(`卡牌圖${o.name}處理完成`)
                            })
                    }
                    console.log('完成')
                } catch (err) {
                    console.error('發生錯誤,無法處理', err)
                }
                break
            }
        case '-d':
            {
                const cardSetId = CMD_ARGS[1]
                console.log(`取出ptcgtw.shop的牌組資料:${cardSetId}`)
                try {
                    const cardSet = await getCardset(cardSetId)
                    const num = Object.keys(cardSet).length
                    if (num <= 0)
                        throw new Error('無資料,無法處理牌組')
                    if (!fs.existsSync(cardSetId))
                        fs.mkdirSync(cardSetId, { recursive: true });
                    for await (const [url, o] of Object.entries(cardSet)) {
                        console.log(`${o.name} \t ${o['張數']}張 \t ${url}`)
                        downloadFile(url, { debugName: o.name, dirName: cardSetId })
                            .then(downloaded => {
                                // 只有第一次下載的時候,會去檢查是否這個圖片有細節可用,這會影響到之後名稱,搜尋進化鏈的功能運作
                                // 奶爸網站因為有很多版本,有些圖也是會暫時先上去,而之後會改
                                if (downloaded)
                                    getDetailByImgurUrl(url).then(detail => {
                                        if (!detail.name || detail.name != o.name) {
                                            console.error(`[警示]沒有卡牌'${o.name}'的詳細資料,可能是新卡/暫時使用/不再維護的卡片,建議重新編排卡牌 ${url}`)
                                        }
                                    })
                            })
                    }
                    console.log('完成')
                } catch (err) {
                    console.error('發生錯誤,無法處理', err)
                }
                break
            }
        case '-s':
            {
                const cardName = CMD_ARGS[1];
                console.log(`在ptcgtw.shop搜尋卡片:${cardName}`)
                try {
                    const list = await searchByCardName(cardName)
                    if (list.length < 1)
                        throw Error(`沒找到名稱含有'${cardName}'的卡片`)
                    if (list.length > 20)
                        throw Error(`太多搜尋結果${list.length},不嘗試取回卡片名稱`)
                    console.log('嘗試取回卡片名稱...')
                    for await (const o of list) {
                        const detail = await getDetailByImgurUrl(o.full)
                        console.log(`${detail.name} \t\t ${detail.set_name} \t ${o.full}`)
                    }
                } catch (err) {
                    console.error('發生錯誤,無法處理', err)
                }
                break
            }
        default:
            console.error('使用參數:')
            console.error('  -a <card-set-id>  下載官方牌組資料與卡片')
            console.error('  -d <card-set-id>  下載奶爸牌組資料與卡片')
            console.error('  -s [<target name>] 搜尋卡片')
    }
}
main()
