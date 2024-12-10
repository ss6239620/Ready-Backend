const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const connectToMongo = require('./db');
const dotenv = require('dotenv');
dotenv.config();
const app = express();

app.use(express.json())
app.use(cookieParser());

// const FRONTEND_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_URL;

// Configure CORS options
const corsOptions = {
    origin: ['http://localhost:3000','https://ready-ruddy.vercel.app'], // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable cookies and authentication
};

// Use CORS with the configured options
app.use(cors(corsOptions));

connectToMongo()

app.get('/', (req, res) => {
    res.status(200).send("Server is active")
})

app.use('/api/user', require('./routes/user'))
app.use('/api/tribe', require('./routes/tribe'))
app.use('/api/post', require('./routes/posts'))
app.use('/api/comment', require('./routes/comments'))

app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Backend Started At Port ${PORT}`);
})