import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import userDataRoutes from './routes/userDataRoutes.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Ensure the DB connection is ready before any route runs - required on
// serverless platforms (Vercel) where there's no persistent startup phase
// to connect once up front. connectDB() caches the connection, so this is
// a no-op after the first successful call in a given instance.
app.use(async (req, res, next) => {
    try {
        await connectDB()
        next()
    } catch (error) {
        res.status(500).json({ message: 'Database connection failed' })
    }
})

app.get('/', (req, res) => {
    res.send('backend is running')
})

app.use(userDataRoutes)

export default app
