const bcrypt = require("bcrypt");
const pool = require("../utils/database");

// list users with pagination
const getUsers = async (req, res) => {
  const client = await pool.connect();

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const offset = (page - 1) * limit;

  try {
    // check if users table exists
    const tableExists = await client.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'users'
        )
        `
    );
    if (!tableExists.rows[0].exists)
      return res.status(200).send({ data: { users: [] } });

    // send users list
    const users = await client.query(
      `
      SELECT id, first_name, last_name, email, phone, dob, gender, address
      FROM users
      ORDER BY id
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    const count = await client.query(
      `
      SELECT COUNT(id)
      FROM users
      `
    );

    return res.status(200).send({
      data: { users: users.rows, total_users: parseInt(count.rows[0].count) },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "An error occurred fetching users" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const createUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      dob,
      gender,
      address,
    } = req.body;

    await client.query("BEGIN");

    // create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(500) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        dob DATE NOT NULL,
        gender gender NOT NULL,
        address VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // hash the password before storing
    const hashPassword = await bcrypt.hash(password, 10);

    // insert the user details
    const user = await client.query(
      `
        INSERT INTO users (first_name, last_name, email, password, phone, dob, gender, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id
      `,
      [first_name, last_name, email, hashPassword, phone, dob, gender, address]
    );

    await client.query("COMMIT");
    return res.status(201).send({ data: { id: user.rows[0].id } });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");

    // duplicate email error
    if (err.constraint === "users_email_key")
      return res
        .status(409)
        .json({ error: "User with the email already exists!" });

    res.status(500).json({ error: "An error occurred while creating user" });
  } finally {
    // release the connection pool
    client.release();
  }
};

// get user details
const getUser = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // send user details
    const user = await client.query(
      `
      SELECT first_name, last_name, phone, dob, gender, address
      FROM users
      WHERE id = $1
    `,
      [id]
    );

    if (user.rowCount === 0)
      return res.status(404).json({ error: "User not found" });

    return res.status(200).send({
      data: { user: user.rows[0] },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "An error occurred fetching user details" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const updateUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, dob, gender, address } = req.body;

    await client.query("BEGIN");

    // Update the users record in the database
    const result = await client.query(
      `
      UPDATE users
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          dob = COALESCE($4, dob),
          gender = COALESCE($5, gender),
          address = COALESCE($6, address),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [first_name, last_name, phone, dob, gender, address, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    await client.query("COMMIT");

    // Return the updated users record
    return res.status(200).json({ data: { user: result.rows[0] } });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "An error occurred while updating user" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const deleteUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // delete user
    const user = await client.query(
      `
      DELETE FROM users
        WHERE id = $1
      `,
      [id]
    );
    if (user.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `User with ID ${id} doesn't exist` });
    }
    await client.query("COMMIT");

    // Return response
    return res
      .status(200)
      .json({ data: `User with ID ${id} deleted successfully` });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "An error occurred while deleting user" });
  } finally {
    // release the connection pool
    client.release();
  }
};
module.exports = { getUsers, createUser, getUser, updateUser, deleteUser };
