const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");
const Customers = require("./CustomerModel.js");
const Kost = require("./KostModel.js");

const { DataTypes } = Sequelize;

const FavoriteKost = db.define(
  "favorite_kost",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    kostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Kost, // Reference the Kost table
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

FavoriteKost.belongsTo(Kost, { foreignKey: "id", onDelete: "CASCADE" });
FavoriteKost.belongsTo(Customers, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

module.exports = FavoriteKost;

(async () => {
  await db.sync();
})();
