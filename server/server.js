const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main API Router
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Analytical Engine: Server actively listening on port ${PORT}`);
});
