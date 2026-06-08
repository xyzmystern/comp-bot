const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is online!'));
app.listen(process.env.PORT || 3000);

// This automatically loads your original main bot file
require('./main'); 
