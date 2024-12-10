const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const connectToMongo = require('./db');
const dotenv = require('dotenv');
dotenv.config();
const app = express();

app.use(express.json())
app.use(cookieParser());


const cmd = require('node-cmd');
const crypto = require('crypto'); 
const bodyParser = require('body-parser');

// const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Configure CORS options
const corsOptions = {
    origin: '*', // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false, // Enable cookies and authentication
};

// Use CORS with the configured options
app.use(cors(corsOptions));

connectToMongo()


const onWebhook = (req, res) => {
  let hmac = crypto.createHmac('sha1', process.env.SECRET);
  let sig  = `sha1=${hmac.update(JSON.stringify(req.body)).digest('hex')}`;

  if (req.headers['x-github-event'] === 'push' && sig === req.headers['x-hub-signature']) {
    cmd.run('chmod 777 ./git.sh'); 
    
    cmd.get('./git.sh', (err, data) => {  
      if (data) {
        console.log(data);
      }
      if (err) {
        console.log(err);
      }
    })

    cmd.run('refresh');
  }

  return res.sendStatus(200);
}

app.post('/git', onWebhook);

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