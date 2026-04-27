USE forumDb;

    INSERT INTO users (username, email, password, role, is_banned)
    VALUES
        ('admin', 'admin@ynov.com', 'hashed_password_here', 'admin', false),
        ('john', 'john@ynov.com', 'hashed_password_here', 'user', false);

    INSERT INTO tags (name)
    VALUES
        ('Général'), ('Aide'), ('Discussion'), ('Annonce');

    INSERT INTO topics (user_id, title, body, state, visibility)
    VALUES
        (1, 'Bienvenue sur le forum', 'premier topic de test', 'open', 'public'),
        (2, 'Topic privé de test', 'Contenu privé', 'open', 'private');

    INSERT INTO topic_tag (topic_id, tag_id)
    VALUES
        (1, 1), (1, 4), (2, 3);

    INSERT INTO messages (topic_id, user_id, body)
    VALUES
        (1, 2, 'Premier message de test'),
        (1, 1, 'Réponse de admin');

    INSERT INTO vote (message_id, user_id, type)
    VALUES
        (1, 1, 'liked'),
        (2, 2, 'liked');

    INSERT INTO profiles (user_id, bio)
    VALUES
        (1, 'Admin du forum'),
        (2, 'Utlisateur');

    INSERT INTO friendships (requester_id, receiver_id, state)
    VALUES
        (2, 1, 'pending');