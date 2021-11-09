const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();

const { query } = require('express');

const port = process.env.PORT || 5000;

//middlewawire
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server of Assignment 12')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})