const fs = require('fs');
const axios = require('axios').default;
const path = require('path');

const writeToFile = async (option) => {
    const { fileName, data } = option
    if (Array.isArray(data)) {
        const json = JSON.stringify(data);
        fs.writeFileSync(fileName, json)
        return json;
    }
    fs.writeFileSync(fileName, data)
    return data;
}

const downloadFile = async (url, opt = {}) => {
    if (typeof url !== 'string' || !url)
        throw new Error("download url invalid");

    const fileName = new URL(url).pathname.split('/').pop()
    const filePath = path.join(opt.dirName || './', fileName)
    if (fs.existsSync(filePath)) {
        // console.debug(`cached ${opt.debugName}(${filePath})`)
        return false;
    }

    // console.debug(`download ${opt.debugName} from ${url}, write to ${filePath}`)
    const rsp = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        timeout: 5000
    })
    if (rsp.status !== 200)
        throw new Error(`http status != 200 ${rsp.status} for ${filePath}`);
    else if (!rsp.data)
        throw new Error(`not found data for ${filePath}`);
    rsp.data.pipe(fs.createWriteStream(filePath))
    return true;
}

module.exports = { writeToFile, downloadFile };