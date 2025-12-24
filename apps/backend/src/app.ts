// This file configures the express app
// 
// Data Transfer Layers:
// Routes -> Controllers -> Services -> Repos
//           (http)         (logic)     (db)

import express from 'express'
import { type Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRoutes from './modules/user/user.routes'
import authRoutes from './modules/auth/auth.routes'
import { authUser } from './middleware/auth'

const app: Express = express()
const VITE_PORT = process.env.VITE_PORT || 5173

// Middleware
app.use(cors({
    origin: `http://localhost:${VITE_PORT}`,
    credentials: true
}))
app.use(cookieParser());
app.use(express.json())
app.use(authUser)

// Routes
app.use('/user', userRoutes)
app.use('/auth', authRoutes)

export { app }
