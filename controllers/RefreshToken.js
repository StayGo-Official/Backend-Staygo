const Customers = require("../models/CustomerModel.js");
const jwt = require("jsonwebtoken");

const refreshToken = async(req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if(!refreshToken) return res.sendStatus(401)
        const user = await Customers.findAll({
            where: {
                refresh_token: refreshToken
            }
        })
        if(!user[0]) return res.sendStatus(403)
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if(err) return res.sendStatus(403)
            const userId = user[0].id
            const username = user[0].username
            const email = user[0].email
            const noHp = user[0].noHp
            const alamat = user[0].alamat
            const accessToken = jwt.sign({userId, username, email, noHp, alamat}, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '15s'
            })
            res.json({ accessToken })
        })
    } catch (error) {
        console.log(error);
    }
}

module.exports = refreshToken