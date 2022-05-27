const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.agngo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
      await client.connect();
      console.log('database connected')
      const carPartsItemsCollection = client.db('Car_Parts_Manufacturer_Admin').collection('carPartsItems');
      const orderCollection = client.db('Car_Parts_Manufacturer_Admin').collection('orders');
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
        console.log(result)
        res.send(result);
    })
   
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