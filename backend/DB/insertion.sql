USE forumDb;

-- admin  → Admin1!ynov
-- john   → John1!ynov
-- sarah  → Sarah1!ynov

INSERT INTO users (username, password, role, is_banned, last_login) VALUES
  ('admin', '12569a11c4c8e8ca3f75a0cdaeca7ab51455139ae1f9f8523682194f115b623f12947b48c785d8fc53462a9b63a74da147d2e8e4c9d34b7fc23117dfb9f8781e', 'admin', FALSE, NOW()),
  ('john',  '941f28dabcc9556e633e23d9c9d23be37ac45e9b806eeca5b899ab060a49d14e0a06e8b4f879e3f27a2917b969a172b1adccb7221faf7024ec46f74cedad4575',  'user',  FALSE, NOW()),
  ('sarah', 'c40395c9ab129618af0460fb4b238b47b8cd67a9878592585957a7d46dce1602a2cd6e83d7b0c0abf981869b0f29f0e4824739e4c2408228c2a9c96d28e0b773',  'user',  FALSE, NULL);

INSERT INTO profiles (user_id, bio) VALUES
  (1, 'Administrateur du forum.'),
  (2, 'Designer digital & créateur de produits. Passionné par l''interface spatiale.'),
  (3, 'Curatrice & historienne de l''art. J''explore l''intersection entre technologie et culture.');

INSERT INTO tags (name) VALUES
  ('Général'), ('Aide'), ('Discussion'), ('Annonce'),
  ('Design'), ('Culture'), ('Technologie'), ('Mode');

INSERT INTO topics (user_id, title, body, state, visibility) VALUES
  (2, 'The Future of Spatial Interfaces',       'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Necessitatibus ipsa illo deleniti labore officia neque vero. Eos et assumenda repudiandae quidem voluptatum ex est illum quasi, earum inventore.', 'open',   'public'),
  (3, 'How Museums Are Reinventing Themselves', 'Adipisicing elit. Necessitatibus ipsa illo deleniti labore officia neque vero. Eos et assumenda repudiandae quidem voluptatum ex est illum quasi.', 'open',   'public'),
  (2, 'The Quiet Revolution in Open Source AI', 'Necessitatibus ipsa illo deleniti labore officia neque vero. Eos et assumenda repudiandae quidem voluptatum ex est illum quasi, earum inventore, tempore delectus laboriosam.', 'closed', 'public'),
  (3, 'Topic privé de Sarah',                   'Contenu visible seulement par les amis.', 'open', 'private');

INSERT INTO topic_tag (topic_id, tag_id) VALUES
  (1, 5), (1, 7),
  (2, 6), (2, 1),
  (3, 7), (3, 3),
  (4, 6);

INSERT INTO messages (topic_id, user_id, body) VALUES
  (1, 3, 'Totalement d''accord. Je pense que l''intégration de la réalité mixte va transformer notre façon de travailler au quotidien.'),
  (1, 2, 'Quels outils utilisez-vous pour prototyper ces interfaces actuellement ? VisionOS ou autre chose ?'),
  (2, 2, 'Les musées font un travail remarquable pour attirer un public plus jeune.'),
  (3, 3, 'L''open source a complètement changé la donne dans l''IA générative.');

INSERT INTO votes (message_id, user_id, type) VALUES
  (1, 2, 'liked'),
  (1, 1, 'liked'),
  (2, 3, 'liked'),
  (3, 1, 'liked'),
  (4, 2, 'disliked');

INSERT INTO friendships (requester_id, receiver_id, state) VALUES
  (2, 3, 'accepted'),
  (1, 2, 'pending');

INSERT INTO notifications (user_id, type, from_user_id, topic_id) VALUES
  (2, 'friend_request',  1, NULL),
  (2, 'topic_reply',     3, 1),
  (3, 'friend_accepted', 2, NULL),
  (3, 'message_liked',   2, 2);
