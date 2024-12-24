const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()

const port = process.env.PORT || 5000
const app = express()

app.use(cors())
app.use(express.json())

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@main.yolij.mongodb.net/?retryWrites=true&w=majority&appName=Main`
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lue0n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    const database = client.db('soloSphere');
    const jobsCollection = database.collection('jobs');
    const bidsCollection = database.collection('bids');

    app.post('/add-job', async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      // console.log(jobData)
      res.send(result)
    })


    app.get('/jobs', async (req, res) => {
      const result = await jobsCollection.find().toArray()
      res.send(result);
    });

    // get all jobs posted by a specific user 
    app.get('/jobs/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'buyer.email': email }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    })

    // delete a job from db
    app.delete('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    })

    // get single data 
    app.get('/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    })

    app.put('/update-job/:id', async (req, res) => {
      const jobData = req.body;
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updatedData = {
        $set: jobData,
      }
      const options = { upsert: true }
      const result = await jobsCollection.updateOne(query, updatedData, options);
      res.send(result);
    })

    // bidData save in db 
    app.post('/add-bids', async (req, res) => {
      const bidData = req.body;
      const query = { email: bidData.email, jobId: bidData.jobId }
      const alreadyExist = await bidsCollection.findOne(query)
      // console.log('alreadyExist',alreadyExist)
      if (alreadyExist) {
        return res.status(400).send('You have already placed bid for this job')
      }


      const result = await bidsCollection.insertOne(bidData);
      // console.log(bidData)

      const filter = { _id: new ObjectId(bidData.jobId) }
      const update = {
        $inc: { bid_count: 1 },
      }
      const updateBidCount = await jobsCollection.updateOne(filter, update);


      res.send(result)
    })


  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)
app.get('/', (req, res) => {
  res.send('Hello from SoloSphere Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))
