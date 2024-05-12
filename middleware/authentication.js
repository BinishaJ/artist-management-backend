const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  let token = req.headers["authorization"] || req.headers["Authorization"];
  if (token) {
    token = token.split(" ")[1];
    try {
      jwt.verify(token, process.env.SECRET_KEY);
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(403).send({
          error: "Token expired",
        });
      } else {
        console.error("Error verifying token:", error.message);
        return res.status(401).send({
          error: "Invalid token",
        });
      }
    }
  } else {
    return res.status(401).send({
      error: "Missing token",
    });
  }
};

module.exports = authenticate;
