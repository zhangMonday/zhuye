const https = require('https')
const fs = require('fs')
const path = require('path')

const ARCHIVE_URL = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8'
// 页面通过 JSONP 读取的壁纸 URL 列表
const JSONP_FILE = './assets/json/images.json'
// 同源壁纸：由 Action 每天更新，国内访问不依赖 Bing
const WALLPAPER_FILE = './assets/img/bing.jpg'
// 只要 1600x900，控制仓库体积（约 200KB/天）
const WALLPAPER_SIZE = '&w=1600&h=900&rs=1&c=4'

/**
 * 发起 GET 请求并跟随重定向，回调返回 Buffer
 */
function get(url, redirectsLeft, cb) {
  https.get(url, res => {
    const { statusCode, headers } = res
    if (statusCode >= 300 && statusCode < 400 && headers.location && redirectsLeft > 0) {
      res.resume()
      return get(new URL(headers.location, url).toString(), redirectsLeft - 1, cb)
    }
    if (statusCode !== 200) {
      res.resume()
      return cb(new Error('HTTP ' + statusCode + ' for ' + url))
    }
    const chunks = []
    res.on('data', chunk => chunks.push(chunk))
    res.on('end', () => cb(null, Buffer.concat(chunks)))
  }).on('error', cb)
}

get(ARCHIVE_URL, 3, (err, body) => {
  if (err) {
    // 失败时直接退出：保留上一次的 images.json 与壁纸，避免页面背景变空
    console.error('fetch bing archive failed: ' + err.message)
    process.exit(1)
  }

  let images = []
  try {
    images = (JSON.parse(body.toString()).images) || []
  } catch (e) {
    console.error('parse bing archive failed: ' + e.message)
    process.exit(1)
  }
  if (!images.length) {
    console.error('bing archive returns no image, keep the old files')
    process.exit(1)
  }

  const img_url = images.map(img => img.url)
  const jsonpStr = 'getBingImages(' + JSON.stringify(img_url) + ')'
  fs.writeFileSync(JSONP_FILE, jsonpStr)
  console.log('JSON data is saved: ' + jsonpStr)

  // 再把当天第一张壁纸存进仓库，作为页面的同源背景
  get('https://cn.bing.com' + images[0].url + WALLPAPER_SIZE, 3, (err2, imgBuf) => {
    if (err2) {
      console.error('download wallpaper failed, keep the old one: ' + err2.message)
      return
    }
    fs.mkdirSync(path.dirname(WALLPAPER_FILE), { recursive: true })
    fs.writeFileSync(WALLPAPER_FILE, imgBuf)
    console.log('wallpaper saved: ' + WALLPAPER_FILE + ' (' + imgBuf.length + ' bytes)')
  })
})
