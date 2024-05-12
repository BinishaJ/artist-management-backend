const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../utils/database");

// Enum for gender m, f, o
const createGenderEnum = `
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
            CREATE TYPE gender AS ENUM ('m', 'f', 'o');
        END IF;
    END $$;
  `;

// Register Controller
const userRegistration = async (req, res) => {
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
    // Create gender enum if not exists
    await client.query(createGenderEnum);

    // create admin table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin (
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

    // insert the admin details
    const user = await client.query(
      `
        INSERT INTO admin (first_name, last_name, email, password, phone, dob, gender, address)
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
    if (err.constraint === "admin_email_key")
      return res
        .status(409)
        .json({ error: "Admin with the email already exists!" });

    res.status(500).json({ error: "An error occurred during registration" });
  } finally {
    // release the connection pool
    client.release();
  }
};

// Login Controller
const userLogin = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;
    //check for email
    const user = await client.query(
      `
        SELECT password FROM admin 
        WHERE email = ($1) 
      `,
      [email]
    );

    // if admin exists
    if (user.rowCount === 0)
      return res.status(401).send({ error: "Invalid email!" });

    const pwd = user.rows[0].password;

    // compare hashed password
    const validPwd = await bcrypt.compare(password, pwd);
    if (!validPwd)
      return res.status(401).send({ error: "Incorrect password!" });

    // return jwt token
    const token = jwt.sign({ email: email }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ data: { token } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred during login" });
  } finally {
    // release connection pool
    client.release();
  }
};

module.exports = {
  userLogin,
  userRegistration,
};
