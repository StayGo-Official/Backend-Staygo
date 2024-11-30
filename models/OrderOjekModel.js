const { Sequelize } = require("sequelize");
const db = require("../config/Database.js");
const Customers = require("./CustomerModel.js");
const Ojek = require("./OjekModel.js");

const { DataTypes } = Sequelize;

const OrderOjek = db.define(
  "order_ojek",
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

OrderOjek.belongsTo(Ojek, { foreignKey: "ojekId", onDelete: "CASCADE" });
OrderOjek.belongsTo(Customers, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

module.exports = OrderOjek;

(async () => {
  await db.sync();
})();
