const crypto = require('crypto');
const connexion = require('../DB/db.js');

const register = (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const passwordCrypto = crypto.createHash('sha512').update(password).digest('hex');
    if (password.length < 8) {
        res.status(400).json({message: 'mot de passe trop court'});
        return;
    }
    if (!/[A-Z]/.test(password)) {
        res.status(400).json({message: 'majuscule requise'});
        return;
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
        res.status(400).json({message: 'caractère spécial requis'});
        return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        res.status(400).json({message: 'pseudo invalide'});
        return;
    }
    connexion.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',[username, email, passwordCrypto], (err, results) => {
        if (err && err.code === 'ER_DUP_ENTRY') {
            res.status(409).json({message : 'ce pseudo existe déjà'});
        } else if(err) {
            res.status(500).json({ error: err});
        } else {
            res.status(200).json(results);
        }
    });
}

const login = (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    connexion.query('SELECT * FROM users WHERE email = ? OR username = ?',[email, username], (err, results) => {
        if(err) {
            res.status(500).json({ error: err});
        } else if (results.length === 0) {
            res.status(404).json({ message: 'l utilisateur n existe pas'});
        } else {
            const passwordCrypto = crypto.createHash('sha512').update(req.body.password).digest('hex');

            if (passwordCrypto === results[0].password) {
                res.status(200).json({ id: results[0].id, username: results[0].username, email: results[0].email, role: results[0].role });
            } else {
                res.status(401).json({ message: 'mauvais mot de passe '})
            }
        }
    });
}

const createTopic = (req, res) => {
    const user_id = req.body.user_id;
    const title = req.body.title;
    const body = req.body.body;
    connexion.query('INSERT INTO topics (user_id, title, body) VALUES(?, ?, ?)', [user_id, title, body], (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            const topicId = results.insertId;
            connexion.query('SELECT id FROM tags WHERE name = ?', [req.body.tag], (err, results) => {
                if(err) {
                    res.status(500).json({error: err});
                } else {
                    connexion.query('INSERT INTO topic_tag (topic_id, tag_id) VALUES (?, ?)', [topicId, results[0].id], (err, results) => {
                       if(err) {
                           res.status(500).json({error: err});
                       } else {
                           res.status(200).json(results);
                       }
                    });
                }
            });
        }
    });
}

const getTopics = (req, res) => {
    connexion.query('SELECT * FROM topics', (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            res.status(200).json(results);
        }
    });
}

module.exports = {register, login, createTopic, getTopics};