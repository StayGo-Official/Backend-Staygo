const express = require("express");
const {
    getFavoriteKost,
    getFavoriteKostById,
    createFavoriteKost,
    deleteFavoriteKost,
} = require("../controllers/FavoriteKostController.js") 

const { verifyToken } = require("../middleware/VerifyToken.js");

const router = express.Router()

router.get('/favorite-kost', verifyToken, getFavoriteKost)
router.get('/favorite-kost/:id', getFavoriteKostById)
router.post('/favorite-kost', verifyToken, createFavoriteKost)
router.delete('/favorite-kost/:id', verifyToken, deleteFavoriteKost)

module.exports = router;