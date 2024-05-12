const express = require("express");
const router = express.Router();
const songsController = require("../controllers/songsController");
const validation = require("../middleware/validation");
const { songSchema } = require("../utils/validation");

router.route("/").get(songsController.getSongs);
router.route("/").post(validation(songSchema), songsController.createSong);
router.route("/:id").patch(songsController.updateSong);
router.route("/:id").get(songsController.getSong);
router.route("/:id").delete(songsController.deleteSong);

module.exports = router;
