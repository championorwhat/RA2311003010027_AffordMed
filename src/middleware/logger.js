const { v4: uuidv4 } = require("uuid");

const logger = (req, res, next) => {
  const start = Date.now();
  const requestId = uuidv4();

  req.requestId = requestId;

  console.log(`[${requestId}] -> ${req.method} ${req.url} START`);

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `[${requestId}] <- ${req.method} ${req.url} ${res.statusCode} ${duration}ms`
    );
  });

  next();
};

module.exports = logger;