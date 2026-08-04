const crypto = require('crypto');

// Generate a digital signature for the pass payload
const generateQRSignature = (passId, studentId, expiryDate) => {
    const payload = `${passId}:${studentId}:${new Date(expiryDate).getTime()}`;
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
};

// Verify the digital signature from the QR payload
const verifyQRSignature = (passId, studentId, expiryDate, signature) => {
    const expectedSignature = generateQRSignature(passId, studentId, expiryDate);
    return signature === expectedSignature;
};

module.exports = { generateQRSignature, verifyQRSignature };
