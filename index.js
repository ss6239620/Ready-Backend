const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const connectToMongo = require('./db');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const app = express();

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

//server github-to-glitch syncing
const cmd = require('node-cmd')
const crypto = require('crypto')

const verifySignature = (req, res, next) => {
    const payload = JSON.stringify(req.body)
    const hmac = crypto.createHmac('sha1', process.env.GITHUB_SECRET)
    const digest = 'sha1=' + hmac.update(payload).digest('hex')
    const checksum = req.headers['x-hub-signature']

    if (!checksum || !digest || checksum !== digest) {
        return res.status(403).send('auth failed')
    }

    return next()
}

// Github webhook listener
app.post('/git', verifySignature, (req, res) => {
    if (req.headers['x-github-event'] == 'push') {
        cmd.get('bash git.sh', (err, data) => {
            if (err) return console.log(err)
            console.log(data)
            return res.status(200).send(data)
        })
    } else if (req.headers['x-github-event'] == 'ping') {
        return res.status(200).send('PONG')
    } else {
        return res.status(200).send('Unsuported Github event. Nothing done.')
    }
})

//server github-to-glitch syncing End Here

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