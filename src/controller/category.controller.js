const { Op } = require("sequelize");
const { Category } = require("../models");
const { IsEmpty } = require("../helper/validate");
const logError = require("../helper/log_error");

// 1. GET ALL CATEGORIES
const getCategory = async (req, res) => {
  try {
    const { search, active } = req.query;
    let whereClause = {};

    // Optional filter by name
    if (search) {
      whereClause.category_name = { [Op.like]: `%${search}%` };
    }

    // Optional filter by active status
    if (active !== undefined && active !== "") {
      whereClause.active = active === "true" || active === "1" || active === 1 ? 1 : 0;
    }

    const categories = await Category.findAll({
      where: whereClause,
      order: [["category_id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      total: categories.length,
      list: categories,
    });
  } catch (error) {
    logError(res, error, "category.getCategory");
  }
};

// 2. CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { category_name, description, active } = req.body;

    // Validate required fields
    if (IsEmpty(category_name) || !category_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "category_name is required",
      });
    }

    // Check if category name already exists (unique check)
    const existingCategory = await Category.findOne({
      where: { category_name: category_name.trim() },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: `Category '${category_name.trim()}' already exists`,
      });
    }

    // Create new category
    const newCategory = await Category.create({
      category_name: category_name.trim(),
      description: description || null,
      active: active !== undefined ? (active ? 1 : 0) : 1,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    logError(res, error, "category.createCategory");
  }
};

// 3. UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const id = req.params.id || req.body.category_id;
    const { category_name, description, active } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required in URL parameter or body",
      });
    }

    // Find category by Primary Key
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category with ID ${id} not found`,
      });
    }

    // If updating name, check for uniqueness against other records
    if (category_name && category_name.trim() !== category.category_name) {
      const duplicate = await Category.findOne({
        where: {
          category_name: category_name.trim(),
          category_id: { [Op.ne]: id },
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Category name '${category_name.trim()}' is already in use`,
        });
      }
    }

    // Update fields
    await category.update({
      category_name: category_name !== undefined ? category_name.trim() : category.category_name,
      description: description !== undefined ? description : category.description,
      active: active !== undefined ? (active ? 1 : 0) : category.active,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    logError(res, error, "category.updateCategory");
  }
};

// 4. DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required in URL parameter",
      });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category with ID ${id} not found`,
      });
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      message: `Category with ID ${id} deleted successfully`,
    });
  } catch (error) {
    logError(res, error, "category.deleteCategory");
  }
};

module.exports = {
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
