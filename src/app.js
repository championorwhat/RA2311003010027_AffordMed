const express = require("express");
const logger = require("./middleware/logger");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(express.json());
app.use(logger);

app.use("/api/v1/notifications", notificationRoutes);

module.exports = app;