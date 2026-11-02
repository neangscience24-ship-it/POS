const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const SaleReceipt = sequelize.define(
  "SaleReceipt",
  {
    receipt_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    receipt_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
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
    tableName: "tbl_sale_receipt",
    timestamps: false,
  }
);

module.exports = SaleReceipt;
