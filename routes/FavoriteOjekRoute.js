const express = require("express");
const {
    getFavoriteOjek,
    getFavoriteOjekById,
    createFavoriteOjek,
    checkIfFavorite,
    deleteFavoriteOjek,
} = require("../controllers/FavoriteOjekController.js") 

const { verifyToken } = require("../middleware/VerifyToken.js");

const router = express.Router()

router.get('/favorite-ojek', verifyToken, getFavoriteOjek)
router.get('/favorite-ojek/:id', getFavoriteOjekById)
router.post('/favorite-ojek', verifyToken, createFavoriteOjek)
router.delete('/favorite-ojek/:id', verifyToken, deleteFavoriteOjek)
router.get('/favorite-ojek/check/:ojekId', verifyToken, checkIfFavorite);

module.exports = router;