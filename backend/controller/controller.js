const crypto = require('crypto');
const db = require('../DB/db.js');

const sha512 = (str) => crypto.createHash('sha512').update(str).digest('hex');

/* ── helpers ─────────────────────────────────────── */
const query = async (sql, params = []) => {
    const [rows] = await db.query(sql, params);
    return rows;
};

const fail = (res, status, message) => res.status(status).json({ message });
const ok = (res, data) => res.status(200).json(data);

/* ════════════════════════════════════════════════════
   AUTH
════════════════════════════════════════════════════ */
const register = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return fail(res, 400, 'username et password requis');
    if (!/^[a-zA-Z0-9]+$/.test(username))
        return fail(res, 400, 'Pseudo invalide : lettres et chiffres uniquement');
    if (password.length < 8)
        return fail(res, 400, 'Mot de passe trop court (min 8 caractères)');
    if (!/[A-Z]/.test(password))
        return fail(res, 400, 'Mot de passe : une majuscule requise');
    if (!/[^a-zA-Z0-9]/.test(password))
        return fail(res, 400, 'Mot de passe : un caractère spécial requis');

    try {
        const [result] = await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, sha512(password)]
        );
        await db.query('INSERT INTO profiles (user_id) VALUES (?)', [result.insertId]);
        return ok(res, { message: 'Compte créé', userId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return fail(res, 409, 'Ce pseudo est déjà utilisé');
        return fail(res, 500, err.message);
    }
};

const login = async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password)
        return fail(res, 400, 'identifier et password requis');

    try {
        const rows = await query(
            'SELECT * FROM users WHERE username = ?',
            [identifier]
        );
        if (!rows.length) return fail(res, 404, 'Utilisateur introuvable');
        const user = rows[0];
        if (user.is_banned) return fail(res, 403, 'Compte banni');
        if (sha512(password) !== user.password)
            return fail(res, 401, 'Mot de passe incorrect');

        await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
        return ok(res, { id: user.id, username: user.username, role: user.role });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   TOPICS
════════════════════════════════════════════════════ */
const getTopics = async (req, res) => {

    const limit = req.query.limit === 'all' ? 100000 : (parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const { tag, search, userId } = req.query;

    try {
        const where = ['t.state != "archived"'];
        const params = [];
        const cParams = [];

        if (!userId) where.push('t.visibility = "public"');

        if (tag) {
            where.push('tg.name = ?');
            params.push(tag);
            cParams.push(tag);
        }
        if (search) {
            where.push('(t.title LIKE ? OR tg.name LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
            cParams.push(`%${search}%`, `%${search}%`);
        }

        const whereStr = where.join(' AND ');

        const rows = await query(`
            SELECT t.*,
                   u.username                                                         AS author,
                   p.avatar_url,
                   GROUP_CONCAT(DISTINCT tg.name ORDER BY tg.name SEPARATOR ',')     AS tags
            FROM   topics t
            JOIN   users   u  ON u.id  = t.user_id
            LEFT   JOIN profiles p  ON p.user_id  = u.id
            LEFT   JOIN topic_tag tt ON tt.topic_id = t.id
            LEFT   JOIN tags      tg ON tg.id       = tt.tag_id
            WHERE  ${whereStr}
            GROUP  BY t.id
            ORDER  BY t.created_at DESC
            LIMIT  ? OFFSET ?
        `, [...params, limit, offset]);

        const countRows = await query(`
            SELECT COUNT(DISTINCT t.id) AS total
            FROM   topics t
            LEFT   JOIN topic_tag tt ON tt.topic_id = t.id
            LEFT   JOIN tags      tg ON tg.id       = tt.tag_id
            WHERE  ${whereStr}
        `, cParams);

        rows.forEach(r => { r.tags = r.tags ? r.tags.split(',') : []; });
        return ok(res, { topics: rows, total: countRows[0].total, page, limit });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const getTopic = async (req, res) => {

    try {
        const rows = await query(`
            SELECT t.*,
                   u.username AS author,
                   p.avatar_url,
                   GROUP_CONCAT(DISTINCT tg.name ORDER BY tg.name SEPARATOR ',') AS tags
            FROM   topics t
            JOIN   users u   ON u.id       = t.user_id
            LEFT   JOIN profiles p  ON p.user_id  = u.id
            LEFT   JOIN topic_tag tt ON tt.topic_id = t.id
            LEFT   JOIN tags tg      ON tg.id       = tt.tag_id
            WHERE  t.id = ?
            GROUP  BY t.id
        `, [req.params.id]);

        if (!rows.length) return fail(res, 404, 'Topic introuvable');
        const t = rows[0];
        t.tags = t.tags ? t.tags.split(',') : [];
        return ok(res, t);
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const createTopic = async (req, res) => {
    const { user_id, title, body, tags, visibility } = req.body;
    if (!user_id || !title) return fail(res, 400, 'user_id et title requis');

    try {
        const [result] = await db.query(
            'INSERT INTO topics (user_id, title, body, visibility) VALUES (?, ?, ?, ?)',
            [user_id, title, body || '', visibility || 'public']
        );
        const topicId = result.insertId;

        if (Array.isArray(tags) && tags.length) {
            for (const name of tags) {
                const tagRows = await query('SELECT id FROM tags WHERE name = ?', [name]);
                if (tagRows.length) {
                    await db.query('INSERT IGNORE INTO topic_tag (topic_id, tag_id) VALUES (?, ?)', [topicId, tagRows[0].id]);
                }
            }
        }
        return ok(res, { message: 'Topic créé', topicId });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const updateTopic = async (req, res) => {
    const { title, body, state, visibility } = req.body;
    const fields = [], params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (body !== undefined) { fields.push('body = ?'); params.push(body); }
    if (state !== undefined) { fields.push('state = ?'); params.push(state); }
    if (visibility !== undefined) { fields.push('visibility = ?'); params.push(visibility); }

    if (!fields.length) return fail(res, 400, 'Aucun champ à modifier');
    params.push(req.params.id);

    try {
        await db.query(`UPDATE topics SET ${fields.join(', ')} WHERE id = ?`, params);
        return ok(res, { message: 'Topic mis à jour' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const deleteTopic = async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM votes    WHERE message_id IN (SELECT id FROM messages WHERE topic_id = ?)', [id]);
        await db.query('DELETE FROM messages  WHERE topic_id = ?', [id]);
        await db.query('DELETE FROM topic_tag WHERE topic_id = ?', [id]);
        await db.query('DELETE FROM topics    WHERE id = ?', [id]);
        return ok(res, { message: 'Topic supprimé' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   MESSAGES
════════════════════════════════════════════════════ */
const getMessages = async (req, res) => {
    const limit = req.query.limit === 'all' ? 100000 : (parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const sort = req.query.sort === 'popular' ? 'score DESC' : 'm.created_at DESC';

    try {
        const rows = await query(`
            SELECT m.*,
                   u.username AS author,
                   p.avatar_url,
                   COALESCE(SUM(CASE WHEN v.type = 'liked'    THEN 1 ELSE 0 END), 0) AS likes,
                   COALESCE(SUM(CASE WHEN v.type = 'disliked' THEN 1 ELSE 0 END), 0) AS dislikes,
                   COALESCE(SUM(CASE WHEN v.type = 'liked'    THEN 1
                                     WHEN v.type = 'disliked' THEN -1 ELSE 0 END), 0) AS score
            FROM   messages m
            JOIN   users u   ON u.id      = m.user_id
            LEFT   JOIN profiles p ON p.user_id = u.id
            LEFT   JOIN votes v    ON v.message_id = m.id
            WHERE  m.topic_id = ?
            GROUP  BY m.id
            ORDER  BY ${sort}
            LIMIT  ? OFFSET ?
        `, [req.params.id, limit, offset]);

        const countRows = await query(
            'SELECT COUNT(*) AS total FROM messages WHERE topic_id = ?',
            [req.params.id]
        );
        return ok(res, { messages: rows, total: countRows[0].total, page, limit });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const createMessage = async (req, res) => {
    const { user_id, body } = req.body;
    const topic_id = req.params.id;
    if (!user_id || !body) return fail(res, 400, 'user_id et body requis');

    try {
        const topicRows = await query('SELECT state, user_id FROM topics WHERE id = ?', [topic_id]);
        if (!topicRows.length) return fail(res, 404, 'Topic introuvable');
        if (topicRows[0].state !== 'open') return fail(res, 403, 'Ce topic est fermé');

        const [result] = await db.query(
            'INSERT INTO messages (topic_id, user_id, body) VALUES (?, ?, ?)',
            [topic_id, user_id, body]
        );

        const ownerId = topicRows[0].user_id;
        if (ownerId !== parseInt(user_id)) {
            await db.query(
                'INSERT INTO notifications (user_id, type, from_user_id, topic_id) VALUES (?, "topic_reply", ?, ?)',
                [ownerId, user_id, topic_id]
            );
        }
        return ok(res, { message: 'Message créé', messageId: result.insertId });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const deleteMessage = async (req, res) => {
    const { msgId } = req.params;
    try {
        await db.query('DELETE FROM votes    WHERE message_id = ?', [msgId]);
        await db.query('DELETE FROM messages WHERE id = ?', [msgId]);
        return ok(res, { message: 'Message supprimé' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   VOTES
════════════════════════════════════════════════════ */
const voteMessage = async (req, res) => {
    const { msgId } = req.params;
    const { user_id, type } = req.body;
    if (!user_id || !type) return fail(res, 400, 'user_id et type requis');
    if (!['liked', 'disliked'].includes(type)) return fail(res, 400, 'type invalide');

    try {
        const existing = await query(
            'SELECT * FROM votes WHERE message_id = ? AND user_id = ?',
            [msgId, user_id]
        );

        if (existing.length) {
            if (existing[0].type === type) {
                await db.query('DELETE FROM votes WHERE message_id = ? AND user_id = ?', [msgId, user_id]);
                return ok(res, { message: 'Vote retiré' });
            }
            await db.query('UPDATE votes SET type = ? WHERE message_id = ? AND user_id = ?', [type, msgId, user_id]);
            return ok(res, { message: 'Vote mis à jour' });
        }

        await db.query('INSERT INTO votes (message_id, user_id, type) VALUES (?, ?, ?)', [msgId, user_id, type]);

        if (type === 'liked') {
            const msgRow = await query('SELECT user_id, topic_id FROM messages WHERE id = ?', [msgId]);
            if (msgRow.length && msgRow[0].user_id !== parseInt(user_id)) {
                await db.query(
                    'INSERT INTO notifications (user_id, type, from_user_id, topic_id, message_id) VALUES (?, "message_liked", ?, ?, ?)',
                    [msgRow[0].user_id, user_id, msgRow[0].topic_id, msgId]
                );
            }
        }
        return ok(res, { message: 'Vote enregistré' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   PROFILE
════════════════════════════════════════════════════ */
const getProfile = async (req, res) => {
    try {
        const rows = await query(`
            SELECT u.id, u.username, u.role, u.last_login, u.created_at,
                   p.avatar_url, p.bio,
                   (SELECT COUNT(*) FROM topics   WHERE user_id = u.id)                                               AS topic_count,
                   (SELECT COUNT(*) FROM messages WHERE user_id = u.id)                                               AS message_count,
                   (SELECT COUNT(*) FROM friendships WHERE (requester_id = u.id OR receiver_id = u.id) AND state = 'accepted') AS friend_count
            FROM   users u
            LEFT   JOIN profiles p ON p.user_id = u.id
            WHERE  u.id = ?
        `, [req.params.userId]);

        if (!rows.length) return fail(res, 404, 'Utilisateur introuvable');
        return ok(res, rows[0]);
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const updateProfile = async (req, res) => {
    const { bio, avatar_url } = req.body;
    const fields = [], params = [];

    if (bio !== undefined) { fields.push('bio = ?'); params.push(bio); }
    if (avatar_url !== undefined) { fields.push('avatar_url = ?'); params.push(avatar_url); }
    if (!fields.length) return fail(res, 400, 'Aucun champ à modifier');
    params.push(req.params.userId);

    try {
        await db.query(`UPDATE profiles SET ${fields.join(', ')} WHERE user_id = ?`, params);
        return ok(res, { message: 'Profil mis à jour' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   FRIENDS
════════════════════════════════════════════════════ */
const getFriends = async (req, res) => {
    const { userId } = req.params;
    try {
        const rows = await query(`
            SELECT u.id, u.username, p.avatar_url,
                   f.id   AS friendship_id,
                   f.state,
                   f.created_at,
                   CASE WHEN f.requester_id = ? THEN 'sent' ELSE 'received' END AS direction
            FROM   friendships f
            JOIN   users u ON u.id = IF(f.requester_id = ?, f.receiver_id, f.requester_id)
            LEFT   JOIN profiles p ON p.user_id = u.id
            WHERE  f.requester_id = ? OR f.receiver_id = ?
            ORDER  BY f.created_at DESC
        `, [userId, userId, userId, userId]);
        return ok(res, rows);
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const sendFriendRequest = async (req, res) => {
    const { requester_id, receiver_id } = req.body;
    if (!requester_id || !receiver_id) return fail(res, 400, 'requester_id et receiver_id requis');
    if (requester_id === receiver_id) return fail(res, 400, 'Impossible de s\'ajouter soi-même');

    try {
        const existing = await query(
            'SELECT id FROM friendships WHERE (requester_id=? AND receiver_id=?) OR (requester_id=? AND receiver_id=?)',
            [requester_id, receiver_id, receiver_id, requester_id]
        );
        if (existing.length) return fail(res, 409, 'Relation déjà existante');

        const [result] = await db.query(
            'INSERT INTO friendships (requester_id, receiver_id) VALUES (?, ?)',
            [requester_id, receiver_id]
        );
        await db.query(
            'INSERT INTO notifications (user_id, type, from_user_id) VALUES (?, "friend_request", ?)',
            [receiver_id, requester_id]
        );
        return ok(res, { message: 'Demande envoyée', friendshipId: result.insertId });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const respondFriendRequest = async (req, res) => {
    const { friendshipId } = req.params;
    const { state } = req.body;
    if (!['accepted', 'refused'].includes(state)) return fail(res, 400, 'state invalide');

    try {
        const rows = await query('SELECT * FROM friendships WHERE id = ?', [friendshipId]);
        if (!rows.length) return fail(res, 404, 'Demande introuvable');

        await db.query('UPDATE friendships SET state = ? WHERE id = ?', [state, friendshipId]);

        if (state === 'accepted') {
            await db.query(
                'INSERT INTO notifications (user_id, type, from_user_id) VALUES (?, "friend_accepted", ?)',
                [rows[0].requester_id, rows[0].receiver_id]
            );
        }
        return ok(res, { message: state === 'accepted' ? 'Ami ajouté' : 'Demande refusée' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const removeFriend = async (req, res) => {
    const { userId, targetId } = req.params;
    try {
        await db.query(
            'DELETE FROM friendships WHERE (requester_id=? AND receiver_id=?) OR (requester_id=? AND receiver_id=?)',
            [userId, targetId, targetId, userId]
        );
        return ok(res, { message: 'Ami retiré' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   NOTIFICATIONS
════════════════════════════════════════════════════ */
const getNotifications = async (req, res) => {
    try {
        const rows = await query(`
            SELECT n.*,
                   u.username  AS from_username,
                   p.avatar_url AS from_avatar,
                   t.title     AS topic_title
            FROM   notifications n
            JOIN   users u   ON u.id      = n.from_user_id
            LEFT   JOIN profiles p ON p.user_id = u.id
            LEFT   JOIN topics t   ON t.id      = n.topic_id
            WHERE  n.user_id = ?
            ORDER  BY n.created_at DESC
            LIMIT  50
        `, [req.params.userId]);

        return ok(res, { notifications: rows, unread: rows.filter(r => !r.is_read).length });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const markNotificationsRead = async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.params.userId]);
        return ok(res, { message: 'Lu' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   TAGS
════════════════════════════════════════════════════ */
const getTags = async (req, res) => {
    try {
        return ok(res, await query('SELECT * FROM tags ORDER BY name'));
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   ADMIN
════════════════════════════════════════════════════ */
const getUsers = async (req, res) => {
    try {
        return ok(res, await query(`
            SELECT u.id, u.username, u.role, u.is_banned, u.last_login, u.created_at,
                   p.avatar_url,
                   (SELECT COUNT(*) FROM topics   WHERE user_id = u.id) AS topic_count,
                   (SELECT COUNT(*) FROM messages WHERE user_id = u.id) AS message_count
            FROM   users u
            LEFT   JOIN profiles p ON p.user_id = u.id
            ORDER  BY u.created_at DESC
        `));
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const banUser = async (req, res) => {
    try {
        await db.query('UPDATE users SET is_banned = TRUE WHERE id = ?', [req.params.id]);
        return ok(res, { message: 'Utilisateur banni' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

const unbanUser = async (req, res) => {
    try {
        await db.query('UPDATE users SET is_banned = FALSE WHERE id = ?', [req.params.id]);
        return ok(res, { message: 'Utilisateur débanni' });
    } catch (err) {
        return fail(res, 500, err.message);
    }
};

/* ════════════════════════════════════════════════════
   EXPORTS
════════════════════════════════════════════════════ */
module.exports = {
    register, login,
    getTopics, getTopic, createTopic, updateTopic, deleteTopic,
    getMessages, createMessage, deleteMessage,
    voteMessage,
    getProfile, updateProfile,
    getFriends, sendFriendRequest, respondFriendRequest, removeFriend,
    getNotifications, markNotificationsRead,
    getTags,
    getUsers, banUser, unbanUser,
};
