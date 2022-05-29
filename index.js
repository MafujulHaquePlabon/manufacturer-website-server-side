const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000; 
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.agngo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
    try {
      await client.connect();
      console.log('database connected')
      const carPartsItemsCollection = client.db('Car_Parts_Manufacturer_Admin').collection('carPartsItems'); 
      const orderCollection = client.db('Car_Parts_Manufacturer_Admin').collection('orders');
      const userCollection = client.db('Car_Parts_Manufacturer_Admin').collection('users');
      const productCollection = client.db('Car_Parts_Manufacturer_Admin').collection('product');

      //carPartsItems API or route
      app.get('/carPartsItems', async (req, res) => {
        const query = {};
        const cursor =carPartsItemsCollection.find(query);
        const carPartsItems = await cursor.toArray();
        res.send(carPartsItems);
      
    });
    app.get('/carPartsItems/:id', async (req, res) =>{
        const id = req.params.id;
        const query = {_id:ObjectId(id)};
        const result = await carPartsItemsCollection.findOne(query);
        res.send(result);
    });
    app.put('/carPartsItems/:id', async(req, res) =>{
        const id = req.params.id;
        const updatedCarPartsItems = req.body;
        const filter = {_id: ObjectId(id)};
        const options = { upsert: true };
        const updatedDoc = {
            $set: {
                quantity: updatedCarPartsItems.quantity
               
            }
        };
        const result = await carPartsItemsCollection.updateOne(filter, updatedDoc, options);
        res.send(result);

    });
     app.post('/orders', async (req, res) => {
        const orders = req.body;
        const result = await orderCollection.insertOne(orders);
        res.send(result);
    });

    app.get('/orders',verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const orders = await orderCollection.find(query).toArray();
         return  res.send(orders);
     }
       else {
        return res.status(403).send({ message: 'forbidden access' });
      } 
    });
    app.get('/user',  verifyJWT,  async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })
    app.put('/user/admin/:email', verifyJWT,  verifyAdmin,  async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    }) ;
    
  
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    }); 
    app.post('/product' , verifyJWT, verifyAdmin , async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    }); 
    app.get('/product', verifyJWT, verifyAdmin, async (req, res) => {
      const product = await productCollection.find().toArray();
      res.send(product);
    });
   
    }
    finally {
  
    }
  }
  
  run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello From Car Parts Manufacturer !')
  })
  
  app.listen(port, () => {
    console.log(`Car Parts Manufacturer App listening on port ${port}`)
  })