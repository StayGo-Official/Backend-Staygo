const Users = require("../models/UserModel.js");
const argon = require("argon2");

const Login = async(req, res) => {
    const user = await Users.findOne({
        where: {
            username: req.body.username
        }
    })
    if (!user) return res.status(404).json({msg: "User tidak ditemukan"})
    const match = await argon.verify(user.password, req.body.password)
    if (!match) return res.status(400).json({msg: "Password Salah"})
    req.session.userId = user.uuid
    const uuid = user.uuid
    const username = user.username
    const email = user.email
    const role = user.role
    res.status(200).json({uuid, username, email, role})
}

const Me = async(req, res) => {
    if(!req.session.userId){
        return res.status(401).json({msg: "Mohon Login Users ke akun anda"})
    }
    const user = await Users.findOne({
        attributes: ['uuid', 'username', 'email', 'role'],
        where: {
            uuid: req.session.userId
        }
    })
    if (!user) return res.status(404).json({msg: "User tidak ditemukan"})
    res.status(200).json(user)
}

const logOut = (req, res) => {
    req.session.destroy((err) => {
        if(err) return res.status(400).json({msg: "tidak dapat logout"})
        res.status(200).json({msg: "Anda telah logout"})
    })
}

module.exports = {
    Login,
    Me,
    logOut
};