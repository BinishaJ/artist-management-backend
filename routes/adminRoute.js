const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const validation = require("../middleware/validation");
const { loginSchema, registerSchema } = require("../utils/validation");

router
  .route("/register")
  .post(validation(registerSchema), adminController.userRegistration);
router.route("/login").post(validation(loginSchema), adminController.userLogin);

module.exports = router;
