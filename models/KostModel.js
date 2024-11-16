const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");

const Users = require("./UserModel.js")

const { DataTypes } = Sequelize;

const Kost = db.define('kost', {
    namaKost: {
        type: DataTypes.STRING,
        allowNull: false
    },
    alamat: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hargaPerbulan: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    hargaPertahun: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tersedia: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fasilitas: {
        type: DataTypes.JSON,
        allowNull: false
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false
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

Users.hasMany(Kost);
Kost.belongsTo(Users, {foreignKey: 'userId'})

module.exports = Kost