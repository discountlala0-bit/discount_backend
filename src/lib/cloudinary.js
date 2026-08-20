import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'sf5rrht3',
  api_key: process.env.CLOUDINARY_API_KEY || '895133665989917',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'DiJIUdljyh-JYOTdWLLiBv_IHto',
});

/**
 * Uploads a file buffer (from Multer memoryStorage) directly to Cloudinary.
 * @param {Buffer} fileBuffer - Buffer of the file
 * @param {string} [folder] - Target folder name on Cloudinary
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = (fileBuffer, folder = process.env.CLOUDINARY_FOLDER || 'discountLala') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
