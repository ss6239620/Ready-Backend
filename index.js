const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const connectToMongo = require('./db');
const fs = require('fs');
const http = require('http')
const dotenv = require('dotenv');
dotenv.config();
const app = express();

// new glitch start test10

app.use(express.json())
app.use(cookieParser());

// const FRONTEND_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_URL;

// Configure CORS options
const corsOptions = {
    origin: ['http://localhost:3000', 'https://ready-ruddy.vercel.app'], // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable cookies and authentication
};

// Use CORS with the configured options
app.use(cors(corsOptions));

const dir = './uploads';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}


connectToMongo()


app.get('/', (req, res) => {
    res.status(200).send("Server is active")
})

app.use('/api/user', require('./routes/user'))
app.use('/api/tribe', require('./routes/tribe'))
app.use('/api/post', require('./routes/posts'))
app.use('/api/comment', require('./routes/comments'))
app.use('/api/chat', require('./routes/chat'))


app.use('/uploads', express.static('uploads'));

const { initSocket } = require('./socket')

const Server = http.createServer(app)

initSocket(Server)


const PORT = process.env.PORT || 9000;
Server.listen(PORT, () => {
    console.log(`Backend Started At Port ${PORT}`);
})