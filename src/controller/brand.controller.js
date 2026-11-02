const { Op } = require("sequelize");
const { Brand } = require("../models");
const { IsEmpty } = require("../helper/validate");
const { removeFile } = require("../helper/upload");
const logError = require("../helper/log_error");

// 1. GET ALL BRANDS
const getBrand = async (req, res) => {
  try {
    const { search, active } = req.query;
    let whereClause = {};

    // Optional filter by brand name
    if (search) {
      whereClause.brand_name = { [Op.like]: `%${search}%` };
    }

    // Optional filter by active status
    if (active !== undefined && active !== "") {
      whereClause.active = active === "true" || active === "1" || active === 1 ? 1 : 0;
    }

    const brands = await Brand.findAll({
      where: whereClause,
      order: [["brand_id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      total: brands.length,
      list: brands,
    });
  } catch (error) {
    logError(res, error, "brand.getBrand");
  }
};

// 2. CREATE BRAND
const createBrand = async (req, res) => {
  try {
    const { brand_name, description, active } = req.body;
    const image = req.file ? req.file.filename : (req.body.image || null);

    // Validate required fields
    if (IsEmpty(brand_name) || !brand_name.trim()) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "brand_name is required",
      });
    }

    // Check if brand name already exists (unique check)
    const existingBrand = await Brand.findOne({
      where: { brand_name: brand_name.trim() },
    });

    if (existingBrand) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `Brand '${brand_name.trim()}' already exists`,
      });
    }

    // Parse active boolean/number
    let isActive = 1;
    if (active !== undefined) {
      isActive = active === true || active === "true" || active === 1 || active === "1" ? 1 : 0;
    }

    // Create new brand
    const newBrand = await Brand.create({
      brand_name: brand_name.trim(),
      description: description || null,
      image: image || null,
      active: isActive,
    });

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: newBrand,
    });
  } catch (error) {
    if (req.file) removeFile(req.file.filename);
    logError(res, error, "brand.createBrand");
  }
};

// 3. UPDATE BRAND
const updateBrand = async (req, res) => {
  try {
    const id = req.params.id || req.body.brand_id;
    const { brand_name, description, active } = req.body;

    if (!id) {
      if (req.file) removeFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "Brand ID is required in URL parameter or body",
      });
    }

    // Find brand by Primary Key
    const brand = await Brand.findByPk(id);
    if (!brand) {
      if (req.file) removeFile(req.file.filename);
      return res.status(404).json({
        success: false,
        message: `Brand with ID ${id} not found`,
      });
    }

    // If updating name, check for uniqueness against other records
    if (brand_name && brand_name.trim() !== brand.brand_name) {
      const duplicate = await Brand.findOne({
        where: {
          brand_name: brand_name.trim(),
          brand_id: { [Op.ne]: id },
        },
      });

      if (duplicate) {
        if (req.file) removeFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: `Brand name '${brand_name.trim()}' is already in use`,
        });
      }
    }

    // Handle image update & cleanup
    let newImage = brand.image;
    if (req.file) {
      // If a previous image existed, clean it up
      if (brand.image && brand.image !== req.file.filename) {
        removeFile(brand.image);
      }
      newImage = req.file.filename;
    } else if (req.body.image !== undefined) {
      // If image is explicitly passed as null/empty string to remove it
      if (!req.body.image && brand.image) {
        removeFile(brand.image);
        newImage = null;
      } else if (req.body.image) {
        newImage = req.body.image;
      }
    }

    // Parse active
    let isActive = brand.active;
    if (active !== undefined) {
      isActive = active === true || active === "true" || active === 1 || active === "1" ? 1 : 0;
    }

    // Update fields
    await brand.update({
      brand_name: brand_name !== undefined ? brand_name.trim() : brand.brand_name,
      description: description !== undefined ? description : brand.description,
      image: newImage,
      active: isActive,
    });

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    if (req.file) removeFile(req.file.filename);
    logError(res, error, "brand.updateBrand");
  }
};

// 4. DELETE BRAND
const deleteBrand = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Brand ID is required in URL parameter",
      });
    }

    const brand = await Brand.findByPk(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: `Brand with ID ${id} not found`,
      });
    }

    // Remove associated image file
    if (brand.image) {
      removeFile(brand.image);
    }

    await brand.destroy();

    res.status(200).json({
      success: true,
      message: `Brand with ID ${id} deleted successfully`,
    });
  } catch (error) {
    logError(res, error, "brand.deleteBrand");
  }
};

module.exports = {
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
};
