 const jwt = require("jsonwebtoken");
 const dotenv = require("dotenv");
dotenv.config(); // Load environment variables from .env file
const TOKEN_RESORUCE_SECRET = process.env.SECRET_KEY; // Get the secret key from environment variables

const validate_token = () => {
  return (req, res, next) => {
    var authorization = req.headers.authorization; // token from client
    var token_from_client = null;
    if (authorization != null && authorization != "") {
      token_from_client = authorization.split(" "); // authorization : "Bearer <token>" 
      token_from_client = token_from_client[1]; // get only access_token
    }

    if (token_from_client == null) {
      res.status(401).send({
        message: "Unauthorized",
      });
    } else {
      jwt.verify(token_from_client, TOKEN_RESORUCE_SECRET, (error, result) => {
        if (error) {
          res.status(401).send({
            message: "Unauthorized",
            error: error,
          });
        } else {
            req.user = result;
         
          next();
        }
      });
    }
  };
};



module.exports = { validate_token };