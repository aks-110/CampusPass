const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (filePath, folder = 'campuspass') => {
    try {
        if (!filePath) return null;
        
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto'
        });
        
        // Clean up the local temp file after uploading to Cloudinary
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('[Cloudinary Upload Error]', error);
        // Attempt cleanup of the local file even on upload failure
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error('[Local File Cleanup Error]', e);
            }
        }
        throw error;
    }
};

module.exports = { cloudinary, uploadToCloudinary };
