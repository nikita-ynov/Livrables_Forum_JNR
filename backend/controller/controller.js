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
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    let query;
    let tab;
    if(req.query.tag) {
        query = `SELECT topics.* FROM topics 
        JOIN topic_tag ON topics.id = topic_tag.topic_id 
        JOIN tags ON topic_tag.tag_id = tags.id 
        WHERE tags.name = ?
        LIMIT ? OFFSET ?`;
        tab = [req.query.tag, limit, offset];
    } else {
        query = 'SELECT * FROM topics LIMIT ? OFFSET ?';
        tab = [limit, offset]
    }
    connexion.query(query, tab, (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            res.status(200).json(results);
        }
    });
}

const getTopic = (req, res) => {
    connexion.query('SELECT * FROM topics WHERE id = ?', [req.params.id], (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            res.status(200).json(results);
        }
    });
}

const updateTopic = (req, res) => {
    const title = req.body.title;
    const body = req.body.body;
    const id = req.params.id;
    connexion.query('UPDATE topics SET title = ?, body = ? WHERE id = ?', [title, body, id], (err, results) => {
       if(err) {
           res.status(500).json({error: err});
       } else {
           res.status(200).json(results);
       }
    });
}

const deleteTopic = (req, res) => {
    connexion.query('DELETE FROM topic_tag WHERE topic_id = ?', [req.params.id], (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            connexion.query('DELETE FROM topics WHERE id = ?', [req.params.id], (err, results) => {
                if(err) {
                    res.status(500).json({error: err});
                } else {
                    res.status(200).json(results);
                }
            });
        }
    });
}

const createMessages = (req, res) => {
    const topic_id = req.params.id;
    const user_id = req.body.user_id;
    const body = req.body.body;
    connexion.query('INSERT INTO messages (topic_id, user_id, body) VALUES (?, ?, ?)', [topic_id, user_id, body], (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            res.status(200).json(results);
        }
    });
}

const getMessages = (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    let query;
    if(req.query.sort === 'likes') {
        query = `SELECT messages.*, 
        SUM(CASE WHEN vote.type = 'liked' THEN 1 WHEN vote.type = 'disliked' THEN -1 ELSE 0 END) as score
        FROM messages 
        LEFT JOIN vote ON messages.id = vote.message_id
        WHERE messages.topic_id = ?
        GROUP BY messages.id
        ORDER BY score DESC
        LIMIT ? OFFSET ?`;
    } else {
        query = 'SELECT * FROM messages WHERE topic_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
    }
    connexion.query(query, [req.params.id, limit, offset], (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            res.status(200).json(results);
        }
    });
}

const deleteMessage = (req, res) => {
    connexion.query('DELETE FROM messages WHERE id = ?', [req.params.messageId], (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            res.status(200).json(results);
        }
    });
}

const vote = (req, res) => {
    const message_id = req.params.messageId;
    const user_id = req.body.user_id;
    connexion.query('SELECT * FROM vote WHERE message_id = ? AND user_id = ?', [message_id, user_id], (err, results) => {
        if(err) {
            res.status(500).json({error: err});
        } else {
            if(results.length > 0) {
                res.status(409).json({message: 'vous avez déjà voté'})
            } else {
                const type = req.body.type;
                connexion.query('INSERT INTO vote (message_id, user_id, type) VALUES (?, ?, ?)', [message_id, user_id, type], (err, results) => {
                    if(err) {
                        res.status(500).json({error: err});
                    } else {
                        res.status(200).json(results);
                    }
                });
            }
        }
    });
}

module.exports = {register, login, createTopic, getTopics, getTopic, updateTopic, deleteTopic, createMessages, getMessages, deleteMessage, vote};