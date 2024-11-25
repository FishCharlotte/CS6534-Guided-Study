const mysql = require('mysql2/promise');
const utils = require('./utils');

// Connect to MySQL Server
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

/**
 * generateKeyHash
 * @param {String} key 
 * @returns {String}
 */
function generateKeyHash(key) {
    return utils.md5(key);
}

async function initDatabase() {
    try {
        // Create Database
        await pool.query('CREATE DATABASE IF NOT EXISTS example');

        // Connect to `example` Database
        await pool.query('USE example');

        // Create `users` Table
        await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(100) UNIQUE,
          phone VARCHAR(20) UNIQUE,
          password VARCHAR(255) NOT NULL
        )
        `);

        // Initial users
        await insertUser("alice", "alice@gmail.com", "33445566", "123456");
        await insertUser("bob", "bob@gmail.com", "22667788", "123456");
        await insertUser("charlie", "charlie@gmail.com", "54786666", "123456");

        console.log('Database and table created successfully.');

    } catch (e) {
        throw new Error(`Error creating database or table: ${e.message}`);
    }
}

async function insertUser(username, email, phone, password) {
    try {
        const [rows] = await pool.query('INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)',
            [
                username, email, phone,
                generateKeyHash(password), // Save the hash of password. It will be safer ^_^
            ]);
        console.log(`User ${username} inserted successfully.`);
        console.log(rows); 

        // return rows[0].id;
    } catch (error) {
        throw new Error(`Error inserting user: ${error.message}`);
    }
}

async function getUsers() {
    try {
        await pool.query('USE example');
        const [rows] = await pool.query('SELECT id, username FROM users');
        return rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

async function getUserInfo(id) {
    try {
        await pool.query('USE example');
        
        const [rows] = await pool.query('SELECT id, username, phone FROM users WHERE id = ' + id + ' LIMIT 1'); // leak!
        return rows[0];
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}

async function getUserInfoNew(id) {
    try {
        await pool.query('USE example');
        
        const [rows] = await pool.query('SELECT id, username, phone FROM users WHERE id = ? LIMIT 1', [id]); // use the parameterized interface
        return rows[0];
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}

module.exports = {
    pool,
    initDatabase,
    insertUser,
    getUsers,
    getUserInfo,
    getUserInfoNew,
};

