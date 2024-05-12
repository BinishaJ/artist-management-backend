const pool = require("../utils/database");

// Enum for genre (rnb, country, classic, rock, jazz)
const createGenreEnum = `
    DO $$ 
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genre') THEN
            CREATE TYPE genre AS ENUM ('rnb', 'country', 'classic', 'rock', 'jazz');
        END IF;
    END $$;
  `;

// list songs with pagination
const getSongs = async (req, res) => {
  const client = await pool.connect();

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const offset = (page - 1) * limit;

  try {
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
      SELECT id, title, album_name, genre, artist_id
      FROM songs
      ORDER BY id
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    const count = await client.query(
      `
      SELECT COUNT(id)
      FROM songs
      `
    );

    return res.status(200).send({
      data: { songs: songs.rows, total_songs: parseInt(count.rows[0].count) },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "An error occurred fetching songs" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const createSong = async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, album_name, genre, artist_id } = req.body;
    const artistCheck = await client.query(
      `
        SELECT id FROM artists WHERE id = $1
        `,
      [artist_id]
    );

    // If artist ID doesn't exist, throw an error
    if (artistCheck.rowCount === 0) {
      return res
        .status(400)
        .send({ error: `Artist with ID ${artist_id} doesn't exist!` });
    }

    await client.query("BEGIN");
    await client.query(createGenreEnum);

    // create songs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        album_name VARCHAR(255) NOT NULL,
        genre genre NOT NULL,
        artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // insert the song details
    const song = await client.query(
      `
        INSERT INTO songs (title, album_name, genre, artist_id)
        VALUES ($1, $2, $3, $4) 
        RETURNING id
      `,
      [title, album_name, genre, artist_id]
    );

    await client.query("COMMIT");
    return res.status(201).send({ data: { id: song.rows[0].id } });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "An error occurred while creating song" });
  } finally {
    // release the connection pool
    client.release();
  }
};

// get song details
const getSong = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // send song details
    const song = await client.query(
      `
      SELECT title, album_name, genre, artist_id
      FROM songs
      WHERE id = $1
    `,
      [id]
    );

    if (song.rowCount === 0)
      return res.status(404).json({ error: "Song not found" });

    return res.status(200).send({
      data: { song: song.rows[0] },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "An error occurred fetching song details" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const updateSong = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { title, album_name, genre } = req.body;

    await client.query("BEGIN");

    // Update the songs record in the database
    const result = await client.query(
      `
      UPDATE songs
      SET title = COALESCE($1, title),
          album_name = COALESCE($2, album_name),
          genre = COALESCE($3, genre),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
      `,
      [title, album_name, genre, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Song with ID ${id} not found` });
    }
    await client.query("COMMIT");

    // Return the updated songs record
    return res.status(200).json({ data: { song: result.rows[0] } });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "An error occurred while updating song" });
  } finally {
    // release the connection pool
    client.release();
  }
};

const deleteSong = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // delete song
    const song = await client.query(
      `
      DELETE FROM songs
        WHERE id = $1
      `,
      [id]
    );
    if (song.rowCount === 0) {
      return res
        .status(404)
        .json({ error: `Song with ID ${id} doesn't exist` });
    }
    await client.query("COMMIT");

    // Return response
    return res
      .status(200)
      .json({ data: `Song with ID ${id} deleted successfully` });
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: "An error occurred while updating song" });
  } finally {
    // release the connection pool
    client.release();
  }
};
module.exports = { getSongs, createSong, getSong, updateSong, deleteSong };
