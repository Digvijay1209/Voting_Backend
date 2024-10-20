const express=require('express')
const cors = require('cors'); 
const db = require('./db');

const app=express();
app.use(cors());
require('dotenv').config();
const bodyParser=require('body-parser');

app.use(bodyParser.json());

const userRoutes=require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

app.use('/user',userRoutes);
app.use('/candidate',candidateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log('Hello ');
})
