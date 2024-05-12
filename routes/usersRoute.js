const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const validation = require("../middleware/validation");
const { userUpdateSchema, registerSchema } = require("../utils/validation");

router.route("/").get(usersController.getUsers);
router.route("/").post(validation(registerSchema), usersController.createUser);
router
  .route("/:id")
  .patch(validation(userUpdateSchema), usersController.updateUser);
router.route("/:id").delete(usersController.deleteUser);
router.route("/:id").get(usersController.getUser);

module.exports = router;
