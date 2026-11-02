const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const Sale = sequelize.define(
  "Sale",
  {
    sale_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sale_no: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    sale_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "completed",
    },
    notes: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tbl_sale",
    timestamps: false,
  }
);

module.exports = Sale;
