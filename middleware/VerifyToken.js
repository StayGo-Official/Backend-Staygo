const jwt = require("jsonwebtoken");
const blacklistedTokens = new Set();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // if there isn't any token

  if (blacklistedTokens.has(token)) return res.sendStatus(403);
  console.log("Token di-blacklist:", blacklistedTokens);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
};

module.exports = verifyToken