const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelizeConfig");

const ProductMaster = sequelize.define(
  "ProductMaster",
  {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attribute_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    quantity_stock: {
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
    tableName: "tbl_product_master",
    timestamps: true,
    createdAt: "created_date",
    updatedAt: "updated_date",
  }
);

module.exports = ProductMaster;
