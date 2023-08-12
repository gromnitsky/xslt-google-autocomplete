import http from 'http'
import path from 'path'
import fs from 'fs/promises'

let server = http.createServer( (req, res) => {
    let url; try {
        url = new URL(req.url, `http://${req.headers.host}`)
    } catch {
        return usage(res)
    }

    if (req.method === 'GET' && url.pathname === '/api') {
        let gl = url.searchParams.get('gl')
        let q = url.searchParams.get('q')
        if ( !(gl && q)) return usage(res)

        let google = new URL('https://google.com/complete/search')
        google.searchParams.set('output', 'toolbar')
        google.searchParams.set('gl', gl)
        google.searchParams.set('q', q)

        fetch(google).then( r => {
            if (!r.ok) throw new Error(r.statusText)
            return r.text()
        }).then( r => {
            res.setHeader('Content-Type', 'text/xml')
            res.setHeader("Expires", new Date(Date.now() + 600*1000).toUTCString())
            res.end(r)
        }).catch( e => {
            err(res, e.message, 500)
        })

    } else
        serve_static(res, url.pathname)
})

server.listen(process.env.PORT || 3000)

let public_root = path.dirname(await fs.realpath(process.argv[1]))

function serve_static(res, file) {
    if (/^\/+$/.test(file)) file = "index.html"
    let name = path.join(public_root, path.normalize(file))
    let fd
    fs.open(name).then( file_handle => {
        fd = file_handle
        return file_handle.stat()
    }).then( stats => {
        if (!stats.isFile()) throw new Error(":(")
        res.setHeader('Content-Length', stats.size)
        res.setHeader('Content-Type', {
            '.html': 'text/html',
            '.js': 'application/javascript'
        }[path.extname(name)] || 'application/octet-stream')

        return fd.createReadStream()
    }).then( stream => stream.pipe(res)).catch( err => {
        res.statusCode = 404
        console.error(err.message)
        res.end()
    })
}

function usage(res) { err(res, 'usage: /api?gl=CC&q=query') }

function err(res, msg, code = 400) {
    res.statusCode = code
    res.statusMessage = msg
    res.end()
}
