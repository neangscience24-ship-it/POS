const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const SalePayment = sequelize.define(
  "SalePayment",
  {
    sale_payment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sale_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "completed",
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "tbl_sale_payment",
    timestamps: false,
  }
);

module.exports = SalePayment;
