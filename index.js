const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const connectToMongo = require('./db');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const app = express();

// testing4 glitch

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

app.post('/git', verifySignature, (req, res) => {
    const githubEvent = req.headers['x-github-event'];
  
    if (githubEvent === 'pull_request') {
      const action = req.body.action;
      const isMerged = req.body.pull_request.merged;
  
      if (action === 'closed' && isMerged) {
        console.log(`Pull request merged into branch: ${req.body.pull_request.base.ref}`);
        cmd.get('bash git.sh', (err, data) => {
          if (err) {
            console.error(err);
            return res.status(500).send('Error processing merge event');
          }
          console.log(data);
          return res.status(200).send('Merge event processed successfully');
        });
      } else {
        console.log('Pull request closed without merge. No action taken.');
        return res.status(200).send('No action required.');
      }
    } else {
      console.log('Unsupported event received. Ignoring.');
      return res.status(400).send('Unsupported event type.');
    }
  });

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