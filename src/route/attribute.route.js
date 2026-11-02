const {
  getAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} = require("../controller/attribute.controller");

function AttributeRoute(app) {
  app.get("/api/v1/attribute/getall", getAttribute);
  app.post("/api/v1/attribute/create", createAttribute);
  app.put("/api/v1/attribute/update/:id", updateAttribute);
  app.delete("/api/v1/attribute/delete/:id", deleteAttribute);
}

module.exports = AttributeRoute;
