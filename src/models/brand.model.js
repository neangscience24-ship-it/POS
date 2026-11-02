const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const Brand = sequelize.define(
  "Brand",
  {
    brand_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    brand_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    image: {
      type: DataTypes.STRING(255),
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
    tableName: "tbl_brand",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: "updated_date",
  }
);

module.exports = Brand;
