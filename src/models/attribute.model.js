const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const Attribute = sequelize.define(
  "Attribute",
  {
    attribute_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    attribute_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    attribute_value: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
  },
  {
    tableName: "tbl_attribute",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: false,
  }
);

module.exports = Attribute;
