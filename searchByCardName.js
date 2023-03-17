const axios = require('axios').default;
const { writeToFile } = require('./utils');

const LANGUAGE = 0; // 0=繁中

const searchPtcgtwShopByName = async (name, opt = { lang: LANGUAGE }) => {
    const url = new URL('https://ptcgtw.shop/connect_mysql2.php');
    url.searchParams.append('type', '搜尋全條件2');
    url.searchParams.append('name_search', name);
    url.searchParams.append('lan', opt.lang);
    url.searchParams.append('set_name', 'standard');
    url.searchParams.append('text_search', 'no');
    const rsp = await axios.get(url.toString());
    if (rsp.status !== 200) {
        throw new Error('http status != 200' + rsp.status);
    }
    if (!rsp.data) {
        throw new Error('not found data');
    }
    return rsp.data;
}

const removeDebugMsg = (data) => {
    const startPos = data.indexOf('|')
    if (startPos == -1) return [];
    const payload = data.substring(startPos + 1)
    let arr = payload.split('|');
    let results = [];
    for (let i in arr) {
        const [full, thumbnail] = arr[i].split("※")
        results.push({ full, thumbnail });
    }
    return results
}

const main = async (search_name = '') => {
    const data = await searchPtcgtwShopByName(search_name)
    // writeToFile({ fileName: 'searchResponse.txt', data: data }) // debug
    const pruned = removeDebugMsg(data)
    // writeToFile({ fileName: 'searchResult.json', data: pruned }) // debug
    return pruned
}

module.exports = main;