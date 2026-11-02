const { Op } = require("sequelize");
const { ProductMaster, Category, Brand, Attribute, ProductImage } = require("../models");
const { IsEmpty } = require("../helper/validate");
const { removeFile } = require("../helper/upload");
const logError = require("../helper/log_error");

// 1. GET ALL PRODUCT MASTERS
const getProductMaster = async (req, res) => {
  try {
    const { search, category_id, brand_id, attribute_id, active } = req.query;
    let whereClause = {};

    // Search by product_name, sku, or barcode
    if (search) {
      whereClause[Op.or] = [
        { product_name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } },
      ];
    }

    if (category_id) {
      whereClause.category_id = category_id;
    }

    if (brand_id) {
      whereClause.brand_id = brand_id;
    }

    if (attribute_id) {
      whereClause.attribute_id = attribute_id;
    }

    if (active !== undefined && active !== "") {
      whereClause.active = active === "true" || active === "1" || active === 1 ? 1 : 0;
    }

    const products = await ProductMaster.findAll({
      where: whereClause,
      include: [
        { model: Category, as: "category", attributes: ["category_id", "category_name"] },
        { model: Brand, as: "brand", attributes: ["brand_id", "brand_name", "image"] },
        { model: Attribute, as: "attribute", attributes: ["attribute_id", "attribute_name", "attribute_value"] },
        {
          model: ProductImage,
          as: "images",
          order: [["is_primary", "DESC"], ["display_order", "ASC"]],
        },
      ],
      order: [["product_id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      total: products.length,
      list: products,
    });
  } catch (error) {
    logError(res, error, "productMaster.getProductMaster");
  }
};

// 2. GET SINGLE PRODUCT MASTER BY ID
const getProductMasterById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required in URL parameter",
      });
    }

    const product = await ProductMaster.findByPk(id, {
      include: [
        { model: Category, as: "category" },
        { model: Brand, as: "brand" },
        { model: Attribute, as: "attribute" },
        {
          model: ProductImage,
          as: "images",
          order: [["is_primary", "DESC"], ["display_order", "ASC"]],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logError(res, error, "productMaster.getProductMasterById");
  }
};

// 3. CREATE PRODUCT MASTER
const createProductMaster = async (req, res) => {
  try {
    const {
      product_name,
      category_id,
      brand_id,
      attribute_id,
      sku,
      barcode,
      description,
      price,
      cost,
      quantity_stock,
      active,
    } = req.body;

    const image = req.file ? req.file.filename : (req.body.image || null);

    // Validate required fields
    if (IsEmpty(product_name) || !product_name.trim()) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "product_name is required",
      });
    }

    if (IsEmpty(category_id)) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "category_id is required",
      });
    }

    if (IsEmpty(brand_id)) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "brand_id is required",
      });
    }

    if (IsEmpty(sku) || !sku.trim()) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "sku is required",
      });
    }

    if (price === undefined || price === null || isNaN(parseFloat(price))) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "Valid price is required",
      });
    }

    // Check unique SKU
    const existingSku = await ProductMaster.findOne({
      where: { sku: sku.trim() },
    });

    if (existingSku) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `SKU '${sku.trim()}' is already in use`,
      });
    }

    // Check unique Barcode if provided
    if (barcode && barcode.trim()) {
      const existingBarcode = await ProductMaster.findOne({
        where: { barcode: barcode.trim() },
      });

      if (existingBarcode) {
        if (req.file) removeFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: `Barcode '${barcode.trim()}' is already in use`,
        });
      }
    }

    // Verify foreign key existence
    const categoryExists = await Category.findByPk(category_id);
    if (!categoryExists) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `Category with ID ${category_id} does not exist`,
      });
    }

    const brandExists = await Brand.findByPk(brand_id);
    if (!brandExists) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `Brand with ID ${brand_id} does not exist`,
      });
    }

    const parsedAttrId = attribute_id && attribute_id !== "null" && attribute_id !== "" ? Number(attribute_id) : null;
    if (parsedAttrId) {
      const attributeExists = await Attribute.findByPk(parsedAttrId);
      if (!attributeExists) {
        if (req.file) removeFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: `Attribute with ID ${parsedAttrId} does not exist`,
        });
      }
    }

    let isActive = 1;
    if (active !== undefined) {
      isActive = active === true || active === "true" || active === 1 || active === "1" ? 1 : 0;
    }

    const newProduct = await ProductMaster.create({
      product_name: product_name.trim(),
      category_id: Number(category_id),
      brand_id: Number(brand_id),
      attribute_id: parsedAttrId,
      sku: sku.trim(),
      barcode: barcode && barcode.trim() ? barcode.trim() : null,
      description: description && description.trim() ? description.trim() : null,
      image: image || null,
      price: parseFloat(price),
      cost: cost !== undefined && cost !== "" && cost !== "null" && !isNaN(cost) ? parseFloat(cost) : 0.0,
      quantity_stock: quantity_stock !== undefined && quantity_stock !== "" && quantity_stock !== "null" && !isNaN(quantity_stock) ? parseInt(quantity_stock) : 0,
      active: isActive,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    if (req.file) removeFile(req.file.filename);
    logError(res, error, "productMaster.createProductMaster");
  }
};

// 4. UPDATE PRODUCT MASTER
const updateProductMaster = async (req, res) => {
  try {
    const id = req.params.id || req.body.product_id;
    const {
      product_name,
      category_id,
      brand_id,
      attribute_id,
      sku,
      barcode,
      description,
      price,
      cost,
      quantity_stock,
      active,
    } = req.body;

    if (!id) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "Product ID is required in URL parameter or body",
      });
    }

    const product = await ProductMaster.findByPk(id);
    if (!product) {
      if (req.file) removeFile(req.file.filename);
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    // Check SKU duplicate if modified
    if (sku && sku.trim() !== product.sku) {
      const duplicateSku = await ProductMaster.findOne({
        where: {
          sku: sku.trim(),
          product_id: { [Op.ne]: id },
        },
      });

      if (duplicateSku) {
        if (req.file) removeFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: `SKU '${sku.trim()}' is already in use`,
        });
      }
    }

    // Check Barcode duplicate if modified
    if (barcode && barcode.trim() !== product.barcode) {
      const duplicateBarcode = await ProductMaster.findOne({
        where: {
          barcode: barcode.trim(),
          product_id: { [Op.ne]: id },
        },
      });

      if (duplicateBarcode) {
        if (req.file) removeFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: `Barcode '${barcode.trim()}' is already in use`,
        });
      }
    }

    // Handle image update & cleanup
    let newImage = product.image;
    if (req.file) {
      if (product.image && product.image !== req.file.filename) {
        removeFile(product.image);
      }
      newImage = req.file.filename;
    } else if (req.body.image !== undefined) {
      if (!req.body.image && product.image) {
        removeFile(product.image);
        newImage = null;
      } else if (req.body.image) {
        newImage = req.body.image;
      }
    }

    // Parse attribute_id
    let parsedAttrId = product.attribute_id;
    if (attribute_id !== undefined) {
      parsedAttrId = attribute_id && attribute_id !== "null" && attribute_id !== "" ? Number(attribute_id) : null;
    }

    // Parse active
    let isActive = product.active;
    if (active !== undefined) {
      isActive = active === true || active === "true" || active === 1 || active === "1" ? 1 : 0;
    }

    // Update product
    await product.update({
      product_name: product_name !== undefined ? product_name.trim() : product.product_name,
      category_id: category_id !== undefined ? Number(category_id) : product.category_id,
      brand_id: brand_id !== undefined ? Number(brand_id) : product.brand_id,
      attribute_id: parsedAttrId,
      sku: sku !== undefined ? sku.trim() : product.sku,
      barcode: barcode !== undefined ? (barcode && barcode.trim() ? barcode.trim() : null) : product.barcode,
      description: description !== undefined ? (description && description.trim() ? description.trim() : null) : product.description,
      image: newImage,
      price: price !== undefined ? parseFloat(price) : product.price,
      cost: cost !== undefined && cost !== "" && cost !== "null" ? parseFloat(cost) : product.cost,
      quantity_stock: quantity_stock !== undefined && quantity_stock !== "" && quantity_stock !== "null" ? parseInt(quantity_stock) : product.quantity_stock,
      active: isActive,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (req.file) removeFile(req.file.filename);
    logError(res, error, "productMaster.updateProductMaster");
  }
};

// 5. DELETE PRODUCT MASTER
const deleteProductMaster = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required in URL parameter",
      });
    }

    const product = await ProductMaster.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    // Remove associated gallery images and files
    const galleryImages = await ProductImage.findAll({ where: { product_id: id } });
    galleryImages.forEach((img) => {
      if (img.image_url) removeFile(img.image_url);
    });
    await ProductImage.destroy({ where: { product_id: id } });

    // Remove primary image file if distinct
    if (product.image) {
      removeFile(product.image);
    }

    await product.destroy();

    res.status(200).json({
      success: true,
      message: `Product with ID ${id} deleted successfully`,
    });
  } catch (error) {
    logError(res, error, "productMaster.deleteProductMaster");
  }
};

module.exports = {
  getProductMaster,
  getProductMasterById,
  createProductMaster,
  updateProductMaster,
  deleteProductMaster,
};
