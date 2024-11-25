const jwt = require('jsonwebtoken');
const fs = require('fs');
const axios = require('axios');
const ssrfFilter = require('ssrf-req-filter');
const crypto = require('crypto');

// Store CSRF tokens (in production you might want to use Redis instead)
const csrfTokens = new Map();

// Generate CSRF token middleware
const generateCsrfToken = async (ctx, next) => {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store the token with a timestamp (for cleanup)
    csrfTokens.set(token, {
        timestamp: Date.now(),
        used: false
    });

    // Clean up old tokens (optional)
    const ONE_HOUR = 3600000;
    for (const [key, value] of csrfTokens.entries()) {
        if (Date.now() - value.timestamp > ONE_HOUR || value.used) {
            csrfTokens.delete(key);
        }
    }

    ctx.state.csrfToken = token;
    await next();
};

// Verify CSRF token middleware
const verifyCsrfToken = async (ctx, next) => {
    const token = ctx.request.query.csrf_token;

    if (!token || !csrfTokens.has(token)) {
        ctx.status = 403;
        ctx.body = { error: 'Invalid or missing CSRF token' };
        return;
    }

    const tokenData = csrfTokens.get(token);
    if (tokenData.used) {
        ctx.status = 403;
        ctx.body = { error: 'Token has already been used' };
        return;
    }

    // Mark token as used
    tokenData.used = true;
    await next();
};

const showFiles = async (ctx) => {
    let username;
    try {
        const decoded = jwt.verify(ctx.request.headers['x-token'] || '', process.env['JWT_KEY']);

        username = decoded.username;
    } catch (e) {
        throw new Error('Please log in!');
    }

    // Show all files
    const files = fs.readdirSync(`./data/attachments/${username}`);

    ctx.body = {
        msg: 'ok',
        files: files,
        username: username,
    }
};

const downloadFile = async (ctx) => {
    const { username, filename } = ctx.request.params;

    ctx.type = 'application/octet-stream';
    ctx.attachment(filename);
    ctx.body = fs.createReadStream(`./data/attachments/${username}/${filename}`);
}

const downloadFile2 = async (ctx) => {
    // Get the params from query
    const { username, filename } = ctx.request.params;

    // Get the username from JWT
    let my_username;
    try {
        const decoded = jwt.verify(ctx.request.headers['x-token'] || '', process.env['JWT_KEY']);

        my_username = decoded.username;
    } catch (e) {
        // throw new Error('Please log in!');
    }

    // Verify the permission
    if (username !== my_username) {
        ctx.status = 403;
        return ctx.body = 'Forbidden!'
    }

    ctx.type = 'application/octet-stream';
    ctx.attachment(filename);
    ctx.body = fs.createReadStream(`./data/attachments/${username}/${filename}`);
}

const downloadRemoteFile = async (ctx) => {
    const { url } = ctx.request.query;
    
    if (!url) {
        ctx.status = 400;
        return ctx.body = { error: 'URL parameter is required' };
    }

    try {
        // Send request to get remote file, set responseType to arraybuffer for binary data
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            // Add timeout setting
            timeout: 30000,
        });

        // Get filename from response headers
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'downloaded_file';
        
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        } else {
            // If no filename in headers, try to get it from URL
            const urlParts = url.split('/');
            if (urlParts.length > 0) {
                const lastPart = urlParts[urlParts.length - 1].split('?')[0];
                if (lastPart) filename = lastPart;
            }
        }

        // Set response headers
        ctx.type = response.headers['content-type'] || 'application/octet-stream';
        ctx.attachment(filename);
        ctx.body = Buffer.from(response.data);

    } catch (error) {
        if (error.response) {
            // Remote server returned error status code
            ctx.status = error.response.status || 404;
            ctx.body = { error: 'Remote file not found or access denied' };
        } else if (error.request) {
            // Request failed to send
            ctx.status = 500;
            ctx.body = { error: 'Failed to fetch remote file' };
        } else {
            // Other errors
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    }
};

const downloadRemoteFile2 = async (ctx) => {
    const { url } = ctx.request.query;
    
    if (!url) {
        ctx.status = 400;
        return ctx.body = { error: 'URL parameter is required' };
    }

    try {
        // Send request to get remote file with SSRF protection
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            timeout: 30000,
            // Add SSRF protection agents
            httpAgent: ssrfFilter(url),
            httpsAgent: ssrfFilter(url)
        });

        // Get filename from response headers
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'downloaded_file';
        
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        } else {
            // If no filename in headers, try to get it from URL
            const urlParts = url.split('/');
            if (urlParts.length > 0) {
                const lastPart = urlParts[urlParts.length - 1].split('?')[0];
                if (lastPart) filename = lastPart;
            }
        }

        // Set response headers
        ctx.type = response.headers['content-type'] || 'application/octet-stream';
        ctx.attachment(filename);
        ctx.body = Buffer.from(response.data);

    } catch (error) {
        if (error.message && error.message.includes('SSRF')) {
            // Handle SSRF protection errors
            ctx.status = 403;
            ctx.body = { error: 'SSRF protection: Access to this resource is forbidden' };
        } else if (error.response) {
            // Remote server returned error status code
            ctx.status = error.response.status || 404;
            ctx.body = { error: 'Remote file not found or access denied' };
        } else if (error.request) {
            // Request failed to send
            ctx.status = 500;
            ctx.body = { error: 'Failed to fetch remote file' };
        } else {
            // Other errors
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    }
};

// Add new middleware function to check referer
const checkReferer = async (ctx, next) => {
    const referer = ctx.request.headers['referer'];
    const allowedReferer = 'http://127.0.0.1:8081';

    if (!referer || !referer.startsWith(allowedReferer)) {
        ctx.status = 403;
        ctx.body = { error: 'Access denied: Invalid referer' };
        return;
    }

    await next();
};

module.exports = {
    showFiles,
    downloadFile,
    downloadFile2,
    downloadRemoteFile,
    downloadRemoteFile2,
    checkReferer,
    generateCsrfToken,
    verifyCsrfToken,
};
