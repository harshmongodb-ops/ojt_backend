import mongoose from 'mongoose'

// Cached across warm serverless invocations (Vercel reuses the module scope
// between requests on the same instance) so we don't reconnect every request.
let cached = globalThis._mongooseConn
if (!cached) cached = globalThis._mongooseConn = { conn: null, promise: null }

const connectDB = async () => {
    if (cached.conn) return cached.conn

    if (!cached.promise) {
        const uri = process.env.USE_PROXY === 'true'
            ? process.env.MONGODB_URI_PROXY
            : process.env.MONGODB_URI

        cached.promise = mongoose.connect(uri).then((conn) => {
            console.log(`MongoDB connected: ${conn.connection.host}`)
            return conn
        }).catch((error) => {
            cached.promise = null
            throw error
        })
    }

    cached.conn = await cached.promise
    return cached.conn
}

export default connectDB
