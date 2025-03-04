const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../constant');
const User = require('../models/user')
const Tribe = require('../models/tribe')

const auth = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).send({ error: 'Please Provide Cookies' });
    }
    try {
        // Verify the token and decode it
        const data = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(data.id);
        if (!user) {
            return res.status(401).send({ error: 'User does not exist' });
        }
        req.user = data.id; // Attach the user data to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).send({ error: 'Please Authenticate Using Valid Cookies' });
    }
}

//this must be used only with auth middleware and placed after auth
const mod = async (req, res, next) => {
    try {
        let id;
        if (req.method === 'GET' || req.method === 'DELETE') {
            id = req.query.id; // For GET requests, extract ID from query params
        } else {
            id = req.body.id; // For POST, PUT, PATCH, etc., extract ID from the body
        }
        if (!id) {
            return res.status(401).send({ error: 'Please provide tribe id.' });
        }
        const tribe = await Tribe.findOne({ _id: id, current_moderators: { $in: [req.user] } });
        if (!tribe) {
            return res.status(401).send({ error: 'Tribe does not exist or you might not have permission to acess this tribe.' });
        }
        req.tribe_id = id;
        next();
    } catch (error) {
        return res.status(401).send({ error: error });
    }
}

module.exports = { auth, mod };
