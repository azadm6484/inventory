import { v2 as cloudinary } from "cloudinary";

// Configure once (server-side only)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/** Upload a base64 or URL to Cloudinary and return the secure URL + public_id */
export async function uploadImage(
  source: string, // base64 data URI or remote URL
  options?: {
    folder?: string;
    publicId?: string;
    transformation?: object[];
  }
) {
  const result = await cloudinary.uploader.upload(source, {
    folder: options?.folder ?? "enterprise-inventory",
    public_id: options?.publicId,
    overwrite: true,
    transformation: options?.transformation ?? [
      { width: 800, height: 800, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

/** Delete an image from Cloudinary by its public_id */
export async function deleteImage(publicId: string) {
  const result = await cloudinary.uploader.destroy(publicId);
  return result; // { result: 'ok' } on success
}
