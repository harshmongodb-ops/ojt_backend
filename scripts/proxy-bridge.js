// Local SOCKS5 server that tunnels every CONNECT through the network's
// HTTP CONNECT proxy. Lets the MongoDB driver (which only supports SOCKS5
// proxies) reach Atlas through an HTTP-only corporate/school proxy.
//
// Usage: node scripts/proxy-bridge.js
// Then add &proxyHost=127.0.0.1&proxyPort=1080 to MONGODB_URI.

import net from 'net'
import 'dotenv/config'

const LISTEN_HOST = '127.0.0.1'
const LISTEN_PORT = Number(process.env.SOCKS_BRIDGE_PORT || 1080)
const UPSTREAM_PROXY_HOST = process.env.UPSTREAM_PROXY_HOST || '192.168.0.2'
const UPSTREAM_PROXY_PORT = Number(process.env.UPSTREAM_PROXY_PORT || 808)

function connectThroughHttpProxy(targetHost, targetPort) {
    return new Promise((resolve, reject) => {
        const socket = net.connect(UPSTREAM_PROXY_PORT, UPSTREAM_PROXY_HOST, () => {
            socket.write(`CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\nHost: ${targetHost}:${targetPort}\r\nProxy-Connection: Keep-Alive\r\n\r\n`)
        })

        let buffer = Buffer.alloc(0)
        const onData = (chunk) => {
            buffer = Buffer.concat([buffer, chunk])
            const headerEnd = buffer.indexOf('\r\n\r\n')
            if (headerEnd === -1) return

            const statusLine = buffer.slice(0, headerEnd).toString('utf8').split('\r\n')[0]
            socket.removeListener('data', onData)

            if (/^HTTP\/1\.[01] 200/.test(statusLine)) {
                const leftover = buffer.slice(headerEnd + 4)
                resolve({ socket, leftover })
            } else {
                socket.destroy()
                reject(new Error(`Upstream proxy refused CONNECT: ${statusLine}`))
            }
        }
        socket.on('data', onData)
        socket.on('error', reject)
    })
}

const server = net.createServer((client) => {
    client.once('data', (greeting) => {
        // SOCKS5 greeting: [0x05, nmethods, ...methods]
        if (greeting[0] !== 0x05) return client.destroy()
        client.write(Buffer.from([0x05, 0x00])) // no-auth accepted

        client.once('data', async (request) => {
            // [0x05, cmd, 0x00, atyp, addr..., port(2 bytes)]
            if (request[0] !== 0x05 || request[1] !== 0x01) {
                client.write(Buffer.from([0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
                return client.destroy()
            }

            const atyp = request[3]
            let host, portOffset

            if (atyp === 0x01) { // IPv4
                host = `${request[4]}.${request[5]}.${request[6]}.${request[7]}`
                portOffset = 8
            } else if (atyp === 0x03) { // domain name
                const len = request[4]
                host = request.slice(5, 5 + len).toString('utf8')
                portOffset = 5 + len
            } else {
                client.write(Buffer.from([0x05, 0x08, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
                return client.destroy()
            }

            const port = request.readUInt16BE(portOffset)

            try {
                const { socket: upstream, leftover } = await connectThroughHttpProxy(host, port)
                client.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
                if (leftover.length) client.write(leftover)
                upstream.pipe(client)
                client.pipe(upstream)
                upstream.on('error', () => client.destroy())
                client.on('error', () => upstream.destroy())
            } catch (err) {
                console.error(`[proxy-bridge] ${host}:${port} ->`, err.message)
                client.write(Buffer.from([0x05, 0x01, 0x00, 0x01, 0, 0, 0, 0, 0, 0]))
                client.destroy()
            }
        })
    })
    client.on('error', () => {})
})

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
    console.log(`[proxy-bridge] SOCKS5 listening on ${LISTEN_HOST}:${LISTEN_PORT}, tunneling via ${UPSTREAM_PROXY_HOST}:${UPSTREAM_PROXY_PORT}`)
})
