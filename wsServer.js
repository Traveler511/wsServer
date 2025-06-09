import express from 'express'
import { WebSocketServer } from 'ws'

const app = express()
app.use(express.json())

const clients = new Set()

// Создаём WebSocket-сервер
const ws = new WebSocketServer()

const http = app.listen(3001, '0.0.0.0', () => {
    console.log('WebSocket сервер работает на порту 3001')
})

http.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') {
        ws.handleUpgrade(req, socket, head, (ws) => {
            ws.emit('connection', ws, req)
        })
    } else {
        socket.destroy()
    }
})

// Храним всех клиентов
ws.on('connection', (ws) => {
    clients.add(ws)
    console.log('🧍 Клиент подключён. Клиентов:', clients.size)

    if(clients.size > 1) {
        client.send(JSON.stringify({ type: 'setPlayer', state: 2 }))
    }
    ws.on('close', () => {
        clients.delete(ws)
        console.log('🚪 Клиент отключён. Осталось:', clients.size)
    })
})

// Эндпоинт для отправки обновлений
app.post('/broadcast', (req, res) => {
    const gameState = req.body

    for (const client of clients) {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'update', state: gameState }))
        }
    }

    res.sendStatus(200)
})
