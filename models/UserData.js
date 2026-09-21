import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userDataSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'userdata'
})

// Hash the password whenever it's set/changed - covers UserData.create()
// and doc.save(), which both run 'save' middleware (findByIdAndUpdate does not,
// so the update controller hashes it manually before calling that).
// Async pre-hooks don't get a `next` callback from Mongoose - just await and return.
userDataSchema.pre('save', async function () {
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, 10)
})

export default mongoose.model('UserData', userDataSchema)
