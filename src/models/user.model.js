const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    store_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
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
    tableName: "tbl_user",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: "updated_date",
  }
);

module.exports = User;
