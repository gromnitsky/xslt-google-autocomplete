let http = require('http')
let fs = require('fs')
let path = require('path')

let server = http.createServer( (req, res) => {
    if (!/^\/+api/.test(req.url)) return serve_static(req, res, req.url)

    let params = Object.fromEntries(new URLSearchParams(req.url.slice(req.url.indexOf('?'))))
    if ( !(params.gl && params.q)) {
        res.statusCode = 400
        res.statusMessage = 'usage: api?gl=CC&q=query'
        res.end()
        return
    }

    let url = new URL('https://google.com/complete/search')
    url.searchParams.set('output', 'toolbar')
    url.searchParams.set('gl', params.gl)
    url.searchParams.set('q', params.q)

    fetch(url).then( r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.text()
    }).then( r => {
        res.setHeader('Content-Type', 'text/xml')
        res.end(r)
    }).catch( e => {
        console.log(e)
        res.statusCode = 500
        res.statusMessage = e.message
        res.end()
    })
})

if (require.main === module) server.listen(process.env.PORT || 3000)

let public_root = fs.realpathSync(process.cwd())

function serve_static(req, res, file) {
    if (/^\/+$/.test(file)) file = "index.html"
    let name = path.join(public_root, path.normalize(file))
    fs.stat(name, (err, stats) => {
        if (err) {
            res.statusCode = 404
            console.error(err.message)
            res.end()
            return
        }
        res.setHeader('Content-Length', stats.size)
        res.setHeader('Content-Type', "text/html")

        let stream = fs.createReadStream(name)
        stream.on('error', err => {
            res.statusCode = 500
            console.error(err.message)
            res.end()
        })
        stream.pipe(res)
    })
}
