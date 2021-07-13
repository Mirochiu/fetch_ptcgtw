const axios = require('axios').default;
const { writeToFile } = require('./utils');

const LANGUAGE = 0; // 0=繁中

/*
ability_search:
combat_search:
text_search:
card_type:
p_color:
p_level:
p_ability:
c_special:
p_retreat:
p_weak:
p_resistance:
battle_cost:
battle_damage:
HP:
*/

const searchPtcgtwShopByName = async (name, opt = { lang: LANGUAGE }) => {
    const url = new URL('https://ptcgtw.shop/connect_mysql2.php');
    url.searchParams.append('type', '搜尋全條件2');
    url.searchParams.append('name_search', name);
    url.searchParams.append('lan', opt.lang);
    url.searchParams.append('set_name', 'standard');
    url.searchParams.append('text_search', 'no');
    // console.debug(url.toString());

    const rsp = await axios.get(url.toString());
    if (rsp.status !== 200) {
        throw new Error('http status != 200' + rsp.status);
    }
    if (!rsp.data) {
        throw new Error('not found data');
    }
    // console.debug(rsp.data);
    return rsp.data;
}

const removeDebugMsg = (data) => {
    const startPos = data.indexOf('|')
    const payload = data.substring(startPos + 1)
    // console.debug(payload)
    let arr = payload.split('|');
    let results = [];
    for (let i in arr) {
        let [full, thumbnail] = arr[i].split("※")
        results.push({ full, thumbnail });
    }
    return results
}

const main = async (search_name = '') => {
    console.debug(`search card with name:${search_name} in Ptcg.tw shop`)
    const data = await searchPtcgtwShopByName(search_name)
    // debug
    writeToFile({ fileName: 'searchResponse.txt', data: data })
    const pruned = removeDebugMsg(data)
    writeToFile({ fileName: 'searchResult.json', data: pruned })
    return pruned
}

module.exports = main;