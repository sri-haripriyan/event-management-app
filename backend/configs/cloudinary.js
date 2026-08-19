import Cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const cloudinary = Cloudinary.v2;
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "profile_pictures",
		allowec_formats: ["jpg", "png", "jpeg"],
	},
});
const upload = multer({ storage });
export { upload, cloudinary };
