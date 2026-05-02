const axios = require("axios");
const { getTopN } = require("../utils/priority");

const API_URL = "http://20.207.122.201/evaluation-service/notifications";

const TOKEN = process.env.ACCESS_TOKEN;

exports.getTopNotifications = async (n) => {
  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  const notifications = response.data.notifications || [];
  return getTopN(notifications, n);
};