const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");
const Customers = require("./CustomerModel.js");
const Ojek = require("./OjekModel.js");

const { DataTypes } = Sequelize;

const FavoriteOjek = db.define(
  "favorite_ojek",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    ojekId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Ojek, // Reference the Kost table
        key: "id", // Use the primary key 'id' of the Kost model
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
  }
);

FavoriteOjek.belongsTo(Ojek, { foreignKey: "ojekId", onDelete: "CASCADE" });
FavoriteOjek.belongsTo(Customers, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

module.exports = FavoriteOjek;

(async () => {
  await db.sync();
})();
