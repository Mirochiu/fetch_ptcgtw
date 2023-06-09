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
        throw new Error("url invalid for downloading");

    const fileName = new URL(url).pathname.split('/').pop()
    const filePath = path.join(opt.dirName || './', fileName)
    if (fs.existsSync(filePath))
        return { downloaded: false, filePath, fileName };

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
    return { downloaded: true, filePath, fileName };
}

module.exports = { writeToFile, downloadFile };