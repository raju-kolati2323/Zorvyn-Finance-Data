const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const { isTokenRevoked } = require('../utils/tokenRevocation');

exports.protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'User not Authenticated' });
        };

        if (isTokenRevoked(token)) {
            return res.status(401).json({ message: 'User already logged out' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};