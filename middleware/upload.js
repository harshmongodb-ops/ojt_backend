import multer from 'multer'

// Memory storage - the file buffer is uploaded straight to Cloudinary
// (see controllers/userDataController.js), never written to local disk.
const upload = multer({ storage: multer.memoryStorage() })

export default upload
