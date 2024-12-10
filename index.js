const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const connectToMongo = require('./db');
const app = express();

app.use(express.json())
app.use(cookieParser());

// Configure CORS options
const corsOptions = {
    origin: 'http://localhost:3000', // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable cookies and authentication
};

// Use CORS with the configured options
app.use(cors(corsOptions));

connectToMongo()

app.get('/', (req, res) => {
    res.status(200).send("Server is active")
})

app.use('/api/user',require('./routes/user'))
app.use('/api/tribe',require('./routes/tribe'))
app.use('/api/post',require('./routes/posts'))
app.use('/api/comment',require('./routes/comments'))

app.use('/uploads', express.static('uploads'));

app.listen(9000,()=>{
    console.log(`Backend Started At Port 9000`);
})