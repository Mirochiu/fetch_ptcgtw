const axios = require('axios').default;

const Detail2Object = (detail) => {
    const tokens = detail.split('|')
    return {
        'card_type': tokens[1],
        'set_name': tokens[3],
        'set_no': tokens[4],
        'name': tokens[5],
        'jp_name': tokens[6],
        'evo_chain': tokens[8],
    }
}

const getDetailByImgurUrl = async (imgurUrl) => {
    const url = new URL('https://ptcgtw.shop/connect_mysql2.php');
    url.searchParams.append('type', '單卡資料');
    const workaround_url = url.toString() + '&imgur_url=' + imgurUrl
    const rsp = await axios.get(workaround_url);
    if (rsp.status !== 200)
        throw new Error('http status != 200' + rsp.status);
    if (!rsp.data)
        throw new Error('not found data');
    return rsp.data;
}

const main = async (imgurUrl) => {
    if (typeof imgurUrl !== 'string' || !imgurUrl)
        throw new Error('detail target not given');
    return Detail2Object(await getDetailByImgurUrl(imgurUrl))
}

module.exports = main;