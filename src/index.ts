import express from 'express';
import http from "http";
import bodyParser from "body-parser"
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors'; 
import router from './router';
import {RabbitMQService} from "./services/rabbitmq"
require('dotenv').load

const PORT = process.env.PORT || 3000


const app = express();
app.use(cors({credentials:true}));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app)
const rabbitmq = {
    host: `amqp://${process.env.RABBITMQ_USER || "admin"}:${process.env.RABBITMQ_PASS || "admin"}@${process.env.RABBITMQ_HOST || "localhost"}:${process.env.RABBITMQ_PORT || "5672"}`,
    queue: process.env.RABBITMQ_QUEUE || "default"
}
const QueueCon = new RabbitMQService(rabbitmq.host, rabbitmq.queue)
app.use("/", router(QueueCon))
server.on('close', async ()=>{
    await QueueCon.close()
})
server.listen(PORT, ()=>{
    console.log(`[${process.pid}] server running on http://localhost:${PORT}/`)
})