const fs = require('fs').promises;
const axios = require('axios').default;
const { writeToFile } = require('./utils');

const getFromPtcgtwShopOrCache = async (id, force) => {
    const fileName = `${id}.txt`;
    let fileExist
    try {
        await fs.access(fileName, fs.constants.F_OK)
        fileExist = true
    } catch(err) {
        fileExist = false
    }
    
    if (!force && fileExist) {
        const buffer = await fs.readFile(fileName);
        return { fileName, data: buffer.toString() };
    }
    const url = new URL('https://ptcgtw.shop/connect_mysql2.php');
    url.searchParams.append('type', '找牌組');
    url.searchParams.append('short_url', id);
    const rsp = await axios.get(url.toString());
    if (rsp.status !== 200)
        throw new Error('http status != 200' + rsp.status);
    if (!rsp.data)
        throw new Error('not found data');
    return { fileName, data: rsp.data };
}

const decodePtcgtwShop = (share = '') => {
    let choose_list = {};
    t2 = share.split("┤");
    for (let i in t2) {
        t3 = t2[i].split("├");
        let img = t3[0];
        t4 = t3[1].split("┼");
        choose_list[img] = {};
        for (let m in t4) {
            t5 = t4[m].split("┐");
            choose_list[img][t5[0]] = t5[1];
        }
    }
    return choose_list;
}

const main = async (cardSetId, opt = {}) => {
    if (typeof cardSetId !== 'string' || !cardSetId)
        throw new Error('你需要給予牌組ID才能取回');
    const cardSetInfo = await getFromPtcgtwShopOrCache(cardSetId, opt.forceRefresh)
    if (cardSetInfo.data == 'no')
        throw new Error(`伺服器回傳沒有${cardSetId}牌組的資料`);
    await writeToFile(cardSetInfo);
    return decodePtcgtwShop(cardSetInfo.data)
}

module.exports = main
