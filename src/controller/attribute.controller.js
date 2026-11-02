const { Op } = require("sequelize");
const { Attribute } = require("../models");
const { IsEmpty } = require("../helper/validate");
const logError = require("../helper/log_error");

// 1. GET ALL ATTRIBUTES
const getAttribute = async (req, res) => {
  try {
    const { search, active } = req.query;
    let whereClause = {};

    // Filter by attribute name or value
    if (search) {
      whereClause[Op.or] = [
        { attribute_name: { [Op.like]: `%${search}%` } },
        { attribute_value: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by active status
    if (active !== undefined && active !== "") {
      whereClause.active = active === "true" || active === "1" || active === 1 ? 1 : 0;
    }

    const attributes = await Attribute.findAll({
      where: whereClause,
      order: [["attribute_id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      total: attributes.length,
      list: attributes,
    });
  } catch (error) {
    logError(res, error, "attribute.getAttribute");
  }
};

// 2. CREATE ATTRIBUTE
const createAttribute = async (req, res) => {
  try {
    const { attribute_name, attribute_value, active } = req.body;

    // Validate required fields
    if (IsEmpty(attribute_name) || !attribute_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "attribute_name is required",
      });
    }

    if (IsEmpty(attribute_value) || !attribute_value.trim()) {
      return res.status(400).json({
        success: false,
        message: "attribute_value is required",
      });
    }

    // Check duplicate name + value combination
    const existing = await Attribute.findOne({
      where: {
        attribute_name: attribute_name.trim(),
        attribute_value: attribute_value.trim(),
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Attribute '${attribute_name.trim()}: ${attribute_value.trim()}' already exists`,
      });
    }

    const newAttribute = await Attribute.create({
      attribute_name: attribute_name.trim(),
      attribute_value: attribute_value.trim(),
      active: active !== undefined ? (active ? 1 : 0) : 1,
    });

    res.status(201).json({
      success: true,
      message: "Attribute created successfully",
      data: newAttribute,
    });
  } catch (error) {
    logError(res, error, "attribute.createAttribute");
  }
};

// 3. UPDATE ATTRIBUTE
const updateAttribute = async (req, res) => {
  try {
    const id = req.params.id || req.body.attribute_id;
    const { attribute_name, attribute_value, active } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Attribute ID is required in URL parameter or body",
      });
    }

    const attribute = await Attribute.findByPk(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: `Attribute with ID ${id} not found`,
      });
    }

    const nextName = attribute_name !== undefined ? attribute_name.trim() : attribute.attribute_name;
    const nextValue = attribute_value !== undefined ? attribute_value.trim() : attribute.attribute_value;

    // Check duplicate for different record
    const duplicate = await Attribute.findOne({
      where: {
        attribute_name: nextName,
        attribute_value: nextValue,
        attribute_id: { [Op.ne]: id },
      },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Attribute '${nextName}: ${nextValue}' is already in use`,
      });
    }

    await attribute.update({
      attribute_name: nextName,
      attribute_value: nextValue,
      active: active !== undefined ? (active ? 1 : 0) : attribute.active,
    });

    res.status(200).json({
      success: true,
      message: "Attribute updated successfully",
      data: attribute,
    });
  } catch (error) {
    logError(res, error, "attribute.updateAttribute");
  }
};

// 4. DELETE ATTRIBUTE
const deleteAttribute = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Attribute ID is required in URL parameter",
      });
    }

    const attribute = await Attribute.findByPk(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: `Attribute with ID ${id} not found`,
      });
    }

    await attribute.destroy();

    res.status(200).json({
      success: true,
      message: `Attribute with ID ${id} deleted successfully`,
    });
  } catch (error) {
    logError(res, error, "attribute.deleteAttribute");
  }
};

module.exports = {
  getAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute,
};
