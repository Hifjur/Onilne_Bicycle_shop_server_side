const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { query } = require('express');
const admin = require("firebase-admin");
const port = process.env.PORT || 5000;

//jwt verification
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



//middlewawire
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.af0nh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        } catch (error) {

        }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('BikersCorner');
        const bikesCollection = database.collection('bikes');
        const usersCollection = database.collection('users');

        app.get('/bikes', verifyToken, async (req, res) => {
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            const query = { email: email, date: date };
            const cursor = bikesCollection.find(query);
            const bikes = await cursor.toArray();
            res.json(bikes);
        })


        app.post('/bikes', async (req, res) => {
            const bikes = req.body;
            const result = await bikesCollection.insertOne(bikes);
            console.log(result);
            res.json(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        })

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            console.log('put', user);
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else{
                res.status(403).json({message: 'Permission denied'});
            }
        })

    } finally {
        //await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Bike Market is Live')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})