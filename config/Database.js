const { Sequelize } = require("sequelize");

const db = new Sequelize('staygo', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
})

module.exports = db