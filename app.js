import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import connectDB from './config/db.js'
import userDataRoutes from './routes/userDataRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app  = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const port = process.env.PORT || 5000

app.get('/',(req,res)=>{
    res.send('backend is running')

})

app.use(userDataRoutes)

connectDB().then(() => {
    app.listen(port,()=>console.log(`backend is running on Port ${port}`))
})
