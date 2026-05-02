const service = require("../services/notificationService");

exports.getNotifications = async (req, res) => {
  try {
    const data = await service.fetchNotifications();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

exports.getPriorityNotifications = async (req, res) => {
    try {
      const top = await service.getTopNotifications(10);
      res.status(200).json(top);
    } catch (err) {
      console.error("ERROR:", err.message);   // 👈 ADD THIS
      res.status(500).json({ error: err.message });
    }
  };