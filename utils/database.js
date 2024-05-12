const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.PG_CONN + "?sslmode=require",
});

module.exports = pool;
