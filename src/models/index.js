const { sequelize } = require("../config/sequelizeConfig");
const Category = require("./category.model");
const Brand = require("./brand.model");
const Attribute = require("./attribute.model");
const ProductMaster = require("./productMaster.model");
const User = require("./user.model");
const Sale = require("./sale.model");
const SaleItem = require("./saleItem.model");
const SalePayment = require("./salePayment.model");
const SaleReceipt = require("./saleReceipt.model");
const ProductImage = require("./productImage.model");
const CustomerProfile = require("./cus_profile.model");

// Associations / Relationships
ProductMaster.belongsTo(Category, { foreignKey: "category_id", as: "category" });
Category.hasMany(ProductMaster, { foreignKey: "category_id", as: "products" });

ProductMaster.belongsTo(Brand, { foreignKey: "brand_id", as: "brand" });
Brand.hasMany(ProductMaster, { foreignKey: "brand_id", as: "products" });

ProductMaster.belongsTo(Attribute, { foreignKey: "attribute_id", as: "attribute" });
Attribute.hasMany(ProductMaster, { foreignKey: "attribute_id", as: "products" });

ProductMaster.hasMany(ProductImage, { foreignKey: "product_id", as: "images" });
ProductImage.belongsTo(ProductMaster, { foreignKey: "product_id", as: "product" });

// Sale associations
Sale.hasMany(SaleItem, { foreignKey: "sale_id", as: "items" });
SaleItem.belongsTo(Sale, { foreignKey: "sale_id", as: "sale" });

Sale.hasMany(SalePayment, { foreignKey: "sale_id", as: "payments" });
SalePayment.belongsTo(Sale, { foreignKey: "sale_id", as: "sale" });

Sale.hasMany(SaleReceipt, { foreignKey: "sale_id", as: "receipts" });
SaleReceipt.belongsTo(Sale, { foreignKey: "sale_id", as: "sale" });

SaleItem.belongsTo(ProductMaster, { foreignKey: "product_id", as: "product" });
ProductMaster.hasMany(SaleItem, { foreignKey: "product_id", as: "saleItems" });

module.exports = {
  sequelize,
  Category,
  Brand,
  Attribute,
  ProductMaster,
  ProductImage,
  CustomerProfile,
  CusProfile: CustomerProfile,
  User,
  Sale,
  SaleItem,
  SalePayment,
  SaleReceipt,
};
