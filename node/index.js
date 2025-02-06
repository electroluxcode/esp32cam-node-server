
import net from 'net';
import {WebSocketServer } from 'ws';


// step1: 配置

// 1.1 tcp服务器端口，用来接收c语言帧数据
const PORT = 3008;
const HOST = '0.0.0.0'; 

// 1.2 node 服务器端口, 用来连接c语言服务器和前端，起到转发的作用
const WS_PORT = 3009;

// 1.3 前端端口
const FRONT_PORT = 3010;


// step1: 创建 前端用以交互的 WebSocket 服务器
const webSocketServerCase = new WebSocketServer({  port: WS_PORT });
// step2: 创建 TCP 服务器
const server = net.createServer((socket) => {
    console.log('Client connected:', socket.remoteAddress, socket.remotePort,);

    let frameBuffer = Buffer.alloc(0); // 用于存储接收到的帧数据

    // 接收数据
    socket.on('data', (data) => {
        frameBuffer = Buffer.concat([frameBuffer, data]); // 将数据追加到缓冲区
    });

    // 客户端断开连接时保存帧数据
    socket.on('end', () => {
        if (frameBuffer.length > 0) {
            // 将帧数据发送给前端
            if (webSocketServerCase.clients.size > 0) {
                for (const client of webSocketServerCase.clients){
                    client.send(frameBuffer);
                }
            }
        }
    });

    // 错误处理
    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});




// step3: 启动服务器
server.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});


webSocketServerCase.on('connection', (ws) => {
    console.log('WebSocket Client connected');
    ws.on('close', () => {
        console.log('WebSocket Client disconnected');
    });
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});


// step4: 前端页面
import express from 'express';
import cors from 'cors';
import path from 'path';
const app = express();

app.use(cors());
// step4: 嵌入前端
app.get('/',(req,res)=>{
    res.sendFile(path.resolve("./index.html"))        //设置/ 下访问文件位置
});
app.listen(FRONT_PORT, () => {
    console.log(`Server listening on ${HOST}:${FRONT_PORT}`);
});