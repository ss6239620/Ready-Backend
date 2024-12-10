const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../constant');

const auth = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).send({ error: 'Please Provide Cookies' });
    }
    try {
        // Verify the token and decode it
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.id; // Attach the user data to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).send({ error: 'Please Authenticate Using Valid Cookies' });
    }
}

module.exports = auth;
