require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const router  = require('./router/router.js');

const app  = express();
const port = process.env.PORT || 8080;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, '..', 'forum');
app.use(express.static(frontendPath));

app.use('/api', router);

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`✓ Serveur lancé sur http://localhost:${port}`);
    console.log(`✓ Frontend servi depuis ${frontendPath}`);
});
