import express from 'express'
import {
    loginUserData,
    createUserData,
    getAllUserData,
    searchUserData,
    getUserDataById,
    updateUserData,
    deleteUserData
} from '../controllers/userDataController.js'
import authenticateToken from '../utils/authMiddleware.js'
import upload from '../middleware/upload.js'

const router = express.Router()

router.post('/api/userdata/login', loginUserData)

// Create is public - it doubles as the signup endpoint. Without this, a
// fresh database would have no accounts and no way to create the first one.
router.post('/api/userdata', upload.single('image'), createUserData)
router.get('/api/userdata', authenticateToken, getAllUserData)
router.get('/api/userdata/search', authenticateToken, searchUserData)
router.get('/api/userdata/:id', authenticateToken, getUserDataById)
router.put('/api/userdata/:id', authenticateToken, upload.single('image'), updateUserData)
router.delete('/api/userdata/:id', authenticateToken, deleteUserData)

export default router
