const { customAlphabet } = require('nanoid');

// Generate a 6-character uppercase alphanumeric match code
const generateMatchCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

module.exports = generateMatchCode;
