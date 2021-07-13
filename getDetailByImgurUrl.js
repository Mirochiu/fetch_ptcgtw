const axios = require('axios').default;

const Detail2Object = (detail) => {
    // curl 'https://ptcgtw.shop/connect_mysql2.php?type=%E5%96%AE%E5%8D%A1%E8%B3%87%E6%96%99&imgur_url=https://i.imgur.com/ceQBext.jpg'
    //|物品||SV1S|70|巢穴球|ネストボール||※|71|SV1S|70
    // curl 'https://ptcgtw.shop/connect_mysql2.php?type=%E5%96%AE%E5%8D%A1%E8%B3%87%E6%96%99&imgur_url=https://i.imgur.com/HfHiGrf.jpg'
    //|寶可夢|[F]|S12|48|念力土偶|ネンドール||天秤偶※念力土偶※|5|S12|48
    const tokens = detail.split('|')
    // console.debug(`number of tokens ${tokens.length}`)
    return {
        'card_type': tokens[1],
        'set_name': tokens[3],
        'set_no': tokens[4],
        'name': tokens[5],
        'jp_name': tokens[6],
        'evo_chain': tokens[8],
    }
}

// const testUrl = 'https://i.imgur.com/ceQBext.jpg'
// const testUrl = 'https://i.imgur.com/daC73nV.jpg'

const getDetailByImgurUrl = async (imgurUrl) => {
    const url = new URL('https://ptcgtw.shop/connect_mysql2.php');
    url.searchParams.append('type', '單卡資料');
    const workaround_url = url.toString() + '&imgur_url=' + imgurUrl
    // console.debug(workaround_url);
    const rsp = await axios.get(workaround_url);
    if (rsp.status !== 200) {
        throw new Error('http status != 200' + rsp.status);
    }
    if (!rsp.data) {
        throw new Error('not found data');
    }
    return rsp.data;
}

const main = async (imgurUrl) => {
    if (typeof imgurUrl !== 'string' || !imgurUrl)
        throw new Error('search target not given');
    // console.debug(`get card detail with url:${imgurUrl} in Ptcg.tw shop`)
    return Detail2Object(await getDetailByImgurUrl(imgurUrl))
}

module.exports = main;