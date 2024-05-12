const pool = require("../utils/database");

// list artists with pagination
const getArtists = async (req, res) => {
  const client = await pool.connect();

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const offset = (page - 1) * limit;

  try {
    // check if artists table exists
    const tableExists = await client.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'artists'
        )
        `
    );
    if (!tableExists.rows[0].exists)
      return res.status(200).send({ data: { artists: [] } });

    // send artists list
    const artists = await client.query(
      `
      SELECT artists.id, name, dob, gender, address, first_release_year, no_of_albums_released, COUNT(songs.id) AS songs
      FROM artists
      LEFT JOIN songs
      ON songs.artist_id = artists.id
      GROUP BY artists.id, name, dob, gender, address, first_release_year, no_of_albums_released
      ORDER BY artists.id
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    const count = await client.query(
      `
      SELECT COUNT(id)
      FROM artists
      `
    );

    return res.status(200).send({
      data: {
        artists: artists.rows,
        total_artists: parseInt(count.rows[0].count),
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "An error occurred fetching artists" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const createArtist = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name,
      dob,
      gender,
      address,
      first_release_year,
      no_of_albums_released,
    } = req.body;

    await client.query("BEGIN");

    // create artists table
    await client.query(`
      CREATE TABLE IF NOT EXISTS artists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        gender gender NOT NULL,
        address VARCHAR(255) NOT NULL,
        first_release_year INTEGER NOT NULL,
        no_of_albums_released INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // insert the artist details
    const artist = await client.query(
      `
        INSERT INTO artists (name, dob, gender, address, first_release_year,no_of_albums_released)
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id
      `,
      [name, dob, gender, address, first_release_year, no_of_albums_released]
    );

    await client.query("COMMIT");
    return res.status(201).send({ data: { id: artist.rows[0].id } });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "An error occurred while creating artist" });
  } finally {
    // release the connection pool
    client.release();
  }
};

// get artist details
const getArtist = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // send artist details
    const artist = await client.query(
      `
      SELECT name, dob, gender, address, first_release_year, no_of_albums_released
      FROM artists
      WHERE id = $1
    `,
      [id]
    );

    if (artist.rowCount === 0)
      return res.status(404).json({ error: "Artist not found" });

    return res.status(200).send({
      data: { artist: artist.rows[0] },
    });
  } catch (err) {
    console.log(err);

    res
      .status(500)
      .json({ error: "An error occurred fetching artist details" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const updateArtist = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { dob, gender, address, first_release_year, no_of_albums_released } =
      req.body;

    await client.query("BEGIN");

    // Update the artists record in the database
    const result = await client.query(
      `
      UPDATE artists
      SET dob = COALESCE($1, dob),
          gender = COALESCE($2, gender),
          address = COALESCE($3, address),
          first_release_year = COALESCE($4, first_release_year),
          no_of_albums_released = COALESCE($5, no_of_albums_released),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
      `,
      [dob, gender, address, first_release_year, no_of_albums_released, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Artist not found" });
    }
    await client.query("COMMIT");

    // Return the updated artists record
    return res.status(200).json({ data: { artist: result.rows[0] } });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "An error occurred while updating artist" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const deleteArtist = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // delete artist
    const artist = await client.query(
      `
      DELETE FROM artists
        WHERE id = $1
      `,
      [id]
    );
    if (artist.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `Artist with ID ${id} doesn't exist` });
    }
    await client.query("COMMIT");

    // Return response
    return res
      .status(200)
      .json({ data: `Artist with ID ${id} deleted successfully` });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "An error occurred while updating artist" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const getSongs = async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;

  try {
    // check if artist with id exists
    const artistExists = await client.query(
      `
        SELECT name 
        FROM artists
       WHERE id = $1
      `,
      [id]
    );
    if (artistExists.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `Artist with ID ${id} doesn't exist` });
    }

    // check if songs table exists
    const tableExists = await client.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'songs'
        )
        `
    );
    if (!tableExists.rows[0].exists)
      return res.status(200).send({ data: { songs: [] } });

    // send songs list
    const songs = await client.query(
      `
      SELECT id, title, album_name, genre
      FROM songs
      WHERE artist_id = $1
      ORDER BY id
    `,
      [id]
    );

    return res.status(200).send({
      data: {
        songs: songs.rows,
      },
    });
  } catch (err) {
    console.log(err);

    res
      .status(500)
      .json({ error: "An error occurred fetching songs for artist" });
  } finally {
    // release the connection pool
    client.release();
  }
};
module.exports = {
  getArtists,
  createArtist,
  getArtist,
  updateArtist,
  deleteArtist,
  getSongs,
};
