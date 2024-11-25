const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'messages.db');
let db;

// Initialize database
async function initDatabase() {
    const SQL = await initSqlJs();
    
    // Load existing database if it exists
    if (fs.existsSync(dbPath)) {
        const filebuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(filebuffer);
    } else {
        // Create new database
        db = new SQL.Database();
        // Create messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        // Save initial database
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Save database changes
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Initialize database on startup
initDatabase().catch(console.error);

// Get message list with pagination
const getMessages = async (ctx) => {
    const page = parseInt(ctx.query.page) || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    // Get total count
    const totalResult = db.exec('SELECT COUNT(*) as total FROM messages');
    const total = totalResult[0].values[0][0];
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated messages
    const result = db.exec(`
        SELECT * FROM messages 
        ORDER BY created_at DESC 
        LIMIT ${pageSize} OFFSET ${offset}
    `);

    const messages = result.length > 0 ? result[0].values.map(row => ({
        id: row[0],
        author: row[1],
        content: row[2],
        created_at: row[3]
    })) : [];

    ctx.body = {
        messages,
        pagination: {
            current: page,
            total: totalPages,
            pageSize: pageSize
        }
    };
};

// Create new message
const createMessage = async (ctx) => {
    const { author, content } = ctx.request.body;
    
    if (!author || !content) {
        ctx.status = 400;
        ctx.body = { error: 'Author and content are required' };
        return;
    }

    const stmt = db.prepare('INSERT INTO messages (author, content) VALUES (?, ?)');
    stmt.run([author, content]);
    stmt.free();

    // Get the last inserted id
    const result = db.exec('SELECT last_insert_rowid()');
    const id = result[0].values[0][0];

    // Save changes to file
    saveDatabase();

    ctx.body = {
        id,
        author,
        content
    };
};

// Preview message
const previewMessage = async (ctx) => {
    const { author, content } = ctx.query;
    await ctx.render('preview', {
        author: author || '',
        content: content || '',
        preview_time: new Date().toISOString()
    });
};

// Preview message with XSS protection
const previewMessage2 = async (ctx) => {
    const { author, content } = ctx.query;
    
    // Sanitize HTML options
    const options = {
        allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
        allowedAttributes: {
            'a': [ 'href' ]
        },
        allowedSchemes: [ 'http', 'https' ]
    };

    // Sanitize both author and content
    const sanitizedAuthor = sanitizeHtml(author || '', {
        ...options,
        allowedTags: []
    });
    
    const sanitizedContent = sanitizeHtml(content || '', options);

    await ctx.render('preview2', {
        author: sanitizedAuthor,
        content: sanitizedContent,
        preview_time: new Date().toISOString()
    });
};

// Clean up on exit
process.on('SIGINT', () => {
    if (db) {
        saveDatabase();
        db.close();
    }
    process.exit();
});

module.exports = {
    getMessages,
    createMessage,
    previewMessage,
    previewMessage2
}; 