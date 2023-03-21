const fs = require('fs');
const { JSDOM } = require('jsdom');

const CMD_ARGS = process.argv.slice(2)

const htmlPath = CMD_ARGS[0]

if (!fs.existsSync(htmlPath)) {
    console.error(`not found ${htmlPath}`)
    return -1
}

const htmlContent = fs.readFileSync(htmlPath, { includeNodeLocations: true }).toString();

const dom = new JSDOM(htmlContent);
const document = dom.window.document;
// test
//console.log(document.querySelector("p").textContent); 

document.querySelectorAll('div.textList li.card').forEach((e) => {
    const info = e.querySelector('div.cardData')
    const count = parseInt(e.querySelector('div.cardCount').textContent.trim())

    const a = info.querySelector('a[href]');
    const detail_link = a.getAttribute('href')
    const name = a.textContent.trim()
    const series = info.querySelector('span.cardExpansion').textContent.trim()
    const no = info.querySelector('span.cardNumber').textContent.trim()

    const imgUrl = document.querySelector(`a[href="${detail_link}"] img[data-original]`).getAttribute('data-original')

    console.log(`${name} ${count}張 ${series} ${no} ${detail_link} img:${imgUrl}`)
})