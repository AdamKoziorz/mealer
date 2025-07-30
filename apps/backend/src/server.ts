import express from 'express';

const app = express();
const port = 3000;

app.get('/health', (req, res) => {
    res.status(200).send('Ok');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})