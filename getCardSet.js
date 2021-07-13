const fs = require('fs').promises;
const axios = require('axios').default;
const { writeToFile } = require('./utils');

const getFromPtcgtwShopOrCache = async (id, force) => {
    const fileName = `${id}.txt`;
    const fileExist = await fs.access(fileName, fs.constants.F_OK)
    if (!force && fileExist) {
        console.debug(`read from cache ${fileName}`);
        const buffer = await fs.readFile(fileName);
        return { fileName, data: buffer.toString() };
    }

    const url = new URL('https://ptcgtw.shop/connect_mysql2.php');
    url.searchParams.append('type', '找牌組');
    url.searchParams.append('short_url', id);
    // console.debug(url.toString());

    const rsp = await axios.get(url.toString());
    if (rsp.status !== 200) {
        throw new Error('http status != 200' + rsp.status);
    }
    if (!rsp.data) {
        throw new Error('not found data');
    }
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
        throw new Error('cardSetId not given');
    console.debug(`get card set ${cardSetId} from Ptcg.tw shop`)
    const cardSetInfo = await getFromPtcgtwShopOrCache(cardSetId, opt.forceRefresh)
    await writeToFile(cardSetInfo);
    return decodePtcgtwShop(cardSetInfo.data)
}

module.exports = main
