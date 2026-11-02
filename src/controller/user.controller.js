const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { User } = require("../models");
const { IsEmpty } = require("../helper/validate");
const { removeUserProfileFile } = require("../helper/upload");
const logError = require("../helper/log_error");

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
const ALLOWED_ROLES = ["admin", "supervisor", "manager", "cashier", "staff"];

// 1. GET ALL USERS
const getuser = async (req, res) => {
  try {
    const { search, role, active, store_id } = req.query;
    let whereClause = {};

    // Search filter across username, email, full_name
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role && role !== "all") {
      whereClause.role = role.toLowerCase().trim();
    }

    if (store_id) {
      whereClause.store_id = store_id;
    }

    if (active !== undefined && active !== "") {
      whereClause.active = active === "true" || active === "1" || active === 1 ? 1 : 0;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      order: [["user_id", "DESC"]],
    });

    res.status(200).json({
      success: true,
      total: users.length,
      list: users,
    });
  } catch (error) {
    logError(res, error, "user.getuser");
  }
};

// 2. GET SINGLE USER BY ID
const getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required in URL parameter",
      });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    logError(res, error, "user.getUserById");
  }
};

// 3. CREATE USER
const createUser = async (req, res) => {
  try {
    const { username, password, email, full_name, role, store_id, active } = req.body;
    const image = req.file ? req.file.filename : (req.body.image || null);

    // Validate required fields
    if (IsEmpty(username) || !username.trim()) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "username is required",
      });
    }

    if (IsEmpty(password) || !password.trim()) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "password is required",
      });
    }

    if (IsEmpty(email) || !email.trim()) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    if (IsEmpty(role) || !role.trim()) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "role is required",
      });
    }

    const normalizedRole = role.toLowerCase().trim();
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Allowed roles are: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    // Check unique username
    const existingUsername = await User.findOne({
      where: { username: username.trim() },
    });
    if (existingUsername) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `Username '${username.trim()}' already exists`,
      });
    }

    // Check unique email
    const existingEmail = await User.findOne({
      where: { email: email.trim() },
    });
    if (existingEmail) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: `Email '${email.trim()}' already exists`,
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

    let isActive = 1;
    if (active !== undefined) {
      isActive = active === true || active === "true" || active === 1 || active === "1" ? 1 : 0;
    }

    // Create user
    const newUser = await User.create({
      username: username.trim(),
      password: hashedPassword,
      email: email.trim(),
      full_name: full_name && full_name.trim() ? full_name.trim() : null,
      image: image || null,
      role: normalizedRole,
      store_id: store_id !== undefined && store_id !== null && store_id !== "" ? Number(store_id) : null,
      active: isActive,
    });

    const safeUser = newUser.toJSON();
    delete safeUser.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: safeUser,
    });
  } catch (error) {
    if (req.file) removeUserProfileFile(req.file.filename);
    logError(res, error, "user.createUser");
  }
};

// 4. UPDATE USER
const updateUser = async (req, res) => {
  try {
    const id = req.params.id || req.body.user_id;
    const { username, password, email, full_name, role, store_id, active } = req.body;

    if (!id) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(400).json({
        success: false,
        message: "User ID is required in URL parameter or body",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      if (req.file) removeUserProfileFile(req.file.filename);
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`,
      });
    }

    // Validate role if provided
    let normalizedRole = user.role;
    if (role !== undefined && role !== "") {
      normalizedRole = role.toLowerCase().trim();
      if (!ALLOWED_ROLES.includes(normalizedRole)) {
        if (req.file) removeUserProfileFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: `Invalid role '${role}'. Allowed roles are: ${ALLOWED_ROLES.join(", ")}`,
        });
      }
    }

    // Check duplicate username if changed
    if (username && username.trim() !== user.username) {
      const duplicateUsername = await User.findOne({
        where: {
          username: username.trim(),
          user_id: { [Op.ne]: id },
        },
      });

      if (duplicateUsername) {
        if (req.file) removeUserProfileFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: `Username '${username.trim()}' is already in use`,
        });
      }
    }

    // Check duplicate email if changed
    if (email && email.trim() !== user.email) {
      const duplicateEmail = await User.findOne({
        where: {
          email: email.trim(),
          user_id: { [Op.ne]: id },
        },
      });

      if (duplicateEmail) {
        if (req.file) removeUserProfileFile(req.file.filename);
        return res.status(400).json({
          success: false,
          message: `Email '${email.trim()}' is already in use`,
        });
      }
    }

    // Handle image update & cleanup
    let newImage = user.image;
    if (req.file) {
      if (user.image && user.image !== req.file.filename) {
        removeUserProfileFile(user.image);
      }
      newImage = req.file.filename;
    } else if (req.body.image !== undefined) {
      if (!req.body.image && user.image) {
        removeUserProfileFile(user.image);
        newImage = null;
      } else if (req.body.image) {
        newImage = req.body.image;
      }
    }

    // Handle password hashing if a new password is provided
    let newHashedPassword = user.password;
    if (password && password.trim() !== "") {
      const saltRounds = 10;
      newHashedPassword = await bcrypt.hash(password.trim(), saltRounds);
    }

    let isActive = user.active;
    if (active !== undefined) {
      isActive = active === true || active === "true" || active === 1 || active === "1" ? 1 : 0;
    }

    let parsedStoreId = user.store_id;
    if (store_id !== undefined) {
      parsedStoreId = store_id !== null && store_id !== "" && store_id !== "null" ? Number(store_id) : null;
    }

    if (newHashedPassword != "") {
      await user.update({ password: newHashedPassword });
    }
    // Update user record
    await user.update({
      username: username !== undefined ? username.trim() : user.username,
      email: email !== undefined ? email.trim() : user.email,
      full_name: full_name !== undefined ? (full_name ? full_name.trim() : null) : user.full_name,
      image: newImage,
      role: normalizedRole,
      store_id: parsedStoreId,
      active: isActive,
    });

    const safeUser = user.toJSON();
    delete safeUser.password;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: safeUser,
    });
  } catch (error) {
    if (req.file) removeUserProfileFile(req.file.filename);
    logError(res, error, "user.updateUser");
  }
};

// 5. DELETE USER
const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required in URL parameter",
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`,
      });
    }

    // Remove profile picture if exists
    if (user.image) {
      removeUserProfileFile(user.image);
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: `User with ID ${id} deleted successfully`,
    });
  } catch (error) {
    logError(res, error, "user.deleteUser");
  }
};

// 6. LOGIN USER
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (IsEmpty(email) || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (IsEmpty(password) || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email: email.trim() },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.active !== 1) {
      return res.status(403).json({
        success: false,
        message: "User account is disabled",
      });
    }

    // Compare password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        store_id: user.store_id,
      },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    const safeUser = user.toJSON();
    delete safeUser.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: safeUser,
    });
  } catch (error) {
    logError(res, error, "user.login");
  }
};

module.exports = {
  getuser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
};