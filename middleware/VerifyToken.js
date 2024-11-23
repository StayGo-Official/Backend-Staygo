const jwt = require("jsonwebtoken");

// Inisialisasi Set untuk menyimpan token yang di-blacklist
const blacklistedTokens = new Set();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: "Token tidak ditemukan" });
  }

  // Cek apakah token ada dalam daftar blacklist
  if (blacklistedTokens.has(token)) {
    console.log("Token masuk daftar blacklist.");
    return res.status(403).json({ msg: "Token tidak valid" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log("Error saat verifikasi token:", err.message);
      return res.status(403).json({ msg: "Token tidak valid" });
    }
    req.userId = user.userId;
    next();
  });
};

// Ekspor blacklistedTokens jika ingin digunakan di controller
module.exports = {
  verifyToken,
  blacklistedTokens
};
