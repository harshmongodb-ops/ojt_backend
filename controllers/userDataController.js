import bcrypt from 'bcryptjs'
import UserData from '../models/UserData.js'
import generateToken from '../utils/jwtUtils.js'
import cloudinary from '../config/cloudinary.js'

// multer gives us the file as an in-memory buffer (see middleware/upload.js) -
// upload it to Cloudinary and return the hosted URL to store on the record.
const uploadImage = async (file) => {
    const base64 = file.buffer.toString('base64')
    const dataUri = `data:${file.mimetype};base64,${base64}`
    const result = await cloudinary.uploader.upload(dataUri, { folder: 'ojt_backend' })
    return result.secure_url
}

export const loginUserData = async (req, res) => {
    try {
        const existingUser = await UserData.findOne({ email: req.body.email }).select('+password')
        if (!existingUser) {
            return res.status(200).json({ error: 'User Not Found' })
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, existingUser.password)
        if (!isPasswordValid) {
            return res.status(200).json({ error: 'Invalid Password' })
        }

        const token = generateToken(existingUser)
        res.status(200).json({ status: 1, message: 'success', token })
    } catch (error) {
        res.status(200).json({ error: 'Internal server error' })
    }
}

export const createUserData = async (req, res) => {
    try {
        const payload = { ...req.body }
        if (req.file) payload.image = await uploadImage(req.file)
        const userData = await UserData.create(payload)
        res.status(201).json({ status: 1, message: 'success', data: userData })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const getAllUserData = async (req, res) => {
    try {
        const userData = await UserData.find().sort({ createdAt: -1 })
        res.status(200).json({ status: 1, message: 'success', data: userData })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const searchUserData = async (req, res) => {
    try {
        const { q } = req.query
        if (!q) {
            return res.status(400).json({ message: 'Query parameter "q" is required' })
        }
        const regex = new RegExp(q, 'i')
        const userData = await UserData.find({
            $or: [{ name: regex }, { email: regex }, { phone: regex }, { address: regex }]
        })
        res.status(200).json({ status: 1, message: 'success', data: userData })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getUserDataById = async (req, res) => {
    try {
        const userData = await UserData.findById(req.params.id)
        if (!userData) {
            return res.status(404).json({ message: 'User data not found' })
        }
        res.status(200).json({ status: 1, message: 'success', data: userData })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const updateUserData = async (req, res) => {
    try {
        const payload = { ...req.body }
        if (req.file) payload.image = await uploadImage(req.file)

        // findByIdAndUpdate skips the model's 'save' hashing hook, so hash here.
        // Blank/omitted password means "keep current" - never overwrite with it.
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 10)
        } else {
            delete payload.password
        }

        const userData = await UserData.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true
        })
        if (!userData) {
            return res.status(404).json({ message: 'User data not found' })
        }
        res.status(200).json({ status: 1, message: 'success', data: userData })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const deleteUserData = async (req, res) => {
    try {
        const userData = await UserData.findByIdAndDelete(req.params.id)
        if (!userData) {
            return res.status(404).json({ message: 'User data not found' })
        }
        res.status(200).json({ status: 1, message: 'User data deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
