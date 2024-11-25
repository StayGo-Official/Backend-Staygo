const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const Users = require("./UserModel.js")

const { DataTypes } = Sequelize;

const Ojek = db.define('ojek', {
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    namaLengkap: {
        type: DataTypes.STRING,
        allowNull: false
    },
    alamat: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    isRide: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    isFood: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    images: {
        type: DataTypes.JSON, // Stores an array of image paths
        allowNull: true
    },
    url: DataTypes.JSON,
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{
            notEmpty: true
        }
    }
}, {
    freezeTableName: true
});

Users.hasMany(Ojek);
Ojek.belongsTo(Users, {foreignKey: 'userId'})

module.exports = Ojek