const express = require('express');
const connexion = require('./DB/db.js');
const router = require('./router/router.js');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, '..', 'Frontend')));
app.use('/api', router);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'index.html'));
});

connexion.connect((err) => {
    if(err) {
        console.log('Erreur de connexion : '+ err);
    } else {
        console.log('Connexion à la BDD réussie');
    }
})


app.listen(port, () => console.log(`Serveur lancé sur le port ${port}`));