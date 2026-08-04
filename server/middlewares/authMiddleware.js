const { verifyAccessToken } = require('../utils/jwtUtils');

const protect = (req, res, next) => {
    let token = req.cookies?.accessToken;

    // Fallback to headers if cookie not found
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded; // { id, role }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'User role not authorized for this route' });
        }
        next();
    };
};

module.exports = { protect, authorize };
