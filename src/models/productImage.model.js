const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const ProductImage = sequelize.define(
  "ProductImage",
  {
    image_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    image_alt: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "product_image",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = ProductImage;
