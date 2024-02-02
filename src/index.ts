import express from 'express';
import http from "http";
import bodyParser from "body-parser"
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors'; 
import router from './router';
require('dotenv').load

const PORT = process.env.PORT || 3000


const app = express();
app.use(cors({credentials:true}));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app)
app.use("/", router())
server.listen(PORT, ()=>{
    console.log(`[${process.pid}] server running on http://localhost:${PORT}/`)
})