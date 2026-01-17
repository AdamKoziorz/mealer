// Starts the server to be listened to

import { app } from './app'

import dotenv from 'dotenv';
dotenv.config();

const EXPRESS_PORT = process.env.EXPRESS_PORT || 6789

try {
    app.listen(EXPRESS_PORT, () => {
        console.log(`Server running on port ${EXPRESS_PORT}`)
    })
} catch (error) {
    console.error(`Failed to start server: ${error}`)
    process.exit(1)
}
