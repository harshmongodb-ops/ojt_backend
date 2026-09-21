import mongoose from 'mongoose'

const connectDB = async () => {
    const uri = process.env.USE_PROXY === 'true'
        ? process.env.MONGODB_URI_PROXY
        : process.env.MONGODB_URI

    try {
        console.log(uri)
        const conn = await mongoose.connect(uri)
        console.log(`MongoDB connected: ${conn.connection.host}`)
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`)
        process.exit(1)
    }
}

export default connectDB
