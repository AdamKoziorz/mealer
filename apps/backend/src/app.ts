// This file configures the express app
// 
// Data Transfer Layers:
// Routes -> Controllers -> Services -> Repos


import express from 'express'
import cors from 'cors'
import { routes } from './routes'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/v1', routes)

export { app }