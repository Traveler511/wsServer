import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'

const app = express()
app.use(express.json())

const clients = new Set()

// Создаём HTTP-сервер
const server = http.createServer(app)

// Создаём WebSocket-сервер (в режиме noServer)
const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req) // ✅ передаём ws, не wss
        })
    } else {
        socket.destroy()
    }
})

wss.on('connection', (ws) => {
    clients.add(ws)
    console.log('🧍 Клиент подключён. Клиентов:', clients.size)

    if (clients.size > 1) {
        ws.send(JSON.stringify({ type: 'setPlayer', state: 2 }))
    } else {
        ws.send(JSON.stringify({ type: 'setPlayer', state: 1 }))
    }

    ws.on('close', () => {
        clients.delete(ws)
        console.log('🚪 Клиент отключён. Осталось:', clients.size)
    })
})

app.post('/broadcast', (req, res) => {
    const gameState = req.body

    for (const client of clients) {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'update', state: gameState }))
        }
    }

    res.sendStatus(200)
})

// Запускаем сервер
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
    console.log(`🚀 WebSocket-сервер запущен на порту ${PORT}`)
})
