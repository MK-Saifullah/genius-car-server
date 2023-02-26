const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken")
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// Middle wares
app.use(cors());
app.use(express.json());

// console.log(process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.u6oqlug.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


//Verify JWT functionality
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if(!authHeader) {
    return res.status(401).send({ message: 'Invalid authorization access'})
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err) {
      return res.status(403).send({ message: 'Invalid authorization access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    const database = client.db("geniusCar").collection("services");
    const ordersCollection = client.db("geniusCar").collection("orders");
    
    // For jwt token generation
    app.post('/jwt', (req, res) => {
      const user = req.body;
      // console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h'})
      res.send({token}) // send as an object
    })
    
    // All data load (READ)
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = database.find(query);
      const services = await cursor.toArray();
      // console.log(services);

      // print a message if no documents were found
        // if ((await services.count()) === 0) {
        //   console.log("No documents found!");
        // }

      res.send(services);
    });

    // For getting specific id documents (READ)
    app.get('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const service = await database.findOne(query)
        res.send(service)
    })

    // Orders create POST api by using email address

    app.get('/orders', verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log('Inside orders api', decoded)
      if(decoded.email !== req.query.email) {
        res.status(403).send({ message: 'Unauthorized access'})
      }
        // console.log(req.query.email)
        // console.log( req.headers.authorization)
        let query = {}
        if(req.query.email) {
            query = {
                email: req.query.email
            }
        }
        const cursor = ordersCollection.find(query)
        const orders = await cursor.toArray();
        // console.log(orders)
        res.send(orders)
    })

    // All orders create POST api
    app.post('/orders', verifyJWT, async (req, res) => {
        const order = req.body;
        // console.log(order)

        const result = await ordersCollection.insertOne(order)
        // console.log(result);
        res.send(result) 
    })

    // Delete order
    app.delete('/orders/:id', verifyJWT, async (req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await ordersCollection.deleteOne(query)
        // if(result.deletedCount === 1){
        //     console.log('Successfully deleted order')
        // } else {
        //     console.log("No documentation found")
        // }
        res.send(result);
    })

    // Update order
    app.patch('/orders/:id', verifyJWT, async (req, res) => {
        const id = req.params.id;
        const status = req.body.status;
        const query = {_id: new ObjectId(id)}
        const updateDoc = {
            $set: {
                status: status
            }
        }
        const result = await ordersCollection.updateOne(query, updateDoc)
        res.send(result)
    })

  } 
  finally {
  }
}
run().catch(console.dir);

// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

app.get("/", (req, res) => {
  res.send("Genius car servers are available");
});

app.listen(port, () => {
  console.log(`Genius car servers are available at ${port}`);
});
