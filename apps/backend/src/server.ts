// Starts the server to be listened to

import { app } from './app'

const PORT = process.env.EXPRESS_PORT || 3000

try {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
} catch (error) {
    console.error(`Failed to start server: ${error}`)
    process.exit(1)
}