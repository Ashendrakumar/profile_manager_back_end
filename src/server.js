// src/server.js

import app from "./app.js";
import connectDB from "./config/db.js";
import config from "./config/config.js";

connectDB();

app.listen(config.port, () => {
  console.log(`http://localhost:${config.port}`);
});
