import { v2 as cloudinary } from 'cloudinary'

// Reads CLOUDINARY_URL from the environment automatically
// (cloudinary://<api_key>:<api_secret>@<cloud_name>).
cloudinary.config()

export default cloudinary
