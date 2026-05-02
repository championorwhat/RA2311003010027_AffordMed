const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationController");

router.get("/", controller.getNotifications);
router.get("/priority", controller.getPriorityNotifications);

module.exports = router;