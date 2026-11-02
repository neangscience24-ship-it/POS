const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const CustomerProfile = sequelize.define(
  "CustomerProfile",
  {
    customer_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      defaultValue: null,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      defaultValue: null,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    loyalty_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    active: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "tbl_customer_profile",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: "updated_date",
  }
);

module.exports = CustomerProfile;
