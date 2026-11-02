const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const readline = require("readline");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { User, sequelize } = require("../src/models");

const ALLOWED_ROLES = ["admin", "supervisor", "manager", "cashier", "staff"];

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

async function main() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.\n");

    const args = process.argv.slice(2);
    let username = args[0];
    let email = args[1];
    let password = args[2];
    let role = args[3];
    let fullName = args[4];

    if (!username) {
      username = await askQuestion("Enter username: ");
    }
    if (!email) {
      email = await askQuestion("Enter email: ");
    }
    if (!password) {
      password = await askQuestion("Enter password: ");
    }
    if (!role) {
      role = await askQuestion(`Enter role (${ALLOWED_ROLES.join("/")}) [default: admin]: `);
      if (!role) role = "admin";
    }
    if (fullName === undefined) {
      fullName = await askQuestion("Enter full name (optional): ");
    }

    if (!username || !email || !password) {
      console.error("Error: username, email, and password are required.");
      process.exit(1);
    }

    const normalizedRole = role.toLowerCase().trim();
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      console.error(`Error: Invalid role '${role}'. Allowed roles are: ${ALLOWED_ROLES.join(", ")}`);
      process.exit(1);
    }

    // Check if user already exists
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existing) {
      console.error(`Error: A user with username '${username}' or email '${email}' already exists.`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: normalizedRole,
      full_name: fullName || null,
      active: 1,
    });

    console.log("\n User created successfully!");
    console.log(
      JSON.stringify(
        {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          active: user.active,
        },
        null,
        2
      )
    );
    process.exit(0);
  } catch (error) {
    console.error("\nFailed to create user:", error.message);
    process.exit(1);
  }
}

main();
