CREATE DATABASE IF NOT EXISTS forumDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
       use forumDb;
           CREATE TABLE users (
               id INT AUTO_INCREMENT PRIMARY KEY,
               username VARCHAR(50) NOT NULL UNIQUE,
               email VARCHAR(100) NOT NULL UNIQUE,
               password VARCHAR(255) NOT NULL,
               role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
               is_banned BOOLEAN,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
           );
           CREATE TABLE topics (
               id INT AUTO_INCREMENT PRIMARY KEY,
               user_id INT NOT NULL,
               title VARCHAR(100),
               body TEXT,
               state ENUM('open', 'close', 'archived') DEFAULT 'open',
               visibility ENUM('public', 'private') DEFAULT 'public',
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               FOREIGN KEY (user_id) REFERENCES users(id)
           );
           CREATE TABLE tags (
               id INT AUTO_INCREMENT PRIMARY KEY,
               name VARCHAR(50)
           );
           CREATE TABLE topic_tag (
               id INT AUTO_INCREMENT PRIMARY KEY,
               topic_id INT NOT NULL,
               tag_id INT NOT NULL,
               FOREIGN KEY (topic_id) REFERENCES topics(id),
               FOREIGN KEY (tag_id) REFERENCES tags(id)
           );
           CREATE TABLE messages (
               id INT AUTO_INCREMENT PRIMARY KEY,
               topic_id INT NOT NULL,
               user_id INT NOT NULL,
               body TEXT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
               FOREIGN KEY (topic_id) REFERENCES topics(id),
               FOREIGN KEY (user_id) REFERENCES users(id)
           );
           CREATE TABLE vote (
               id INT AUTO_INCREMENT PRIMARY KEY,
               message_id INT NOT NULL,
               user_id INT NOT NULL,
               type ENUM('liked', 'disliked'),
               FOREIGN KEY (message_id) REFERENCES messages(id),
               FOREIGN KEY (user_id) REFERENCES users(id)
           );
           CREATE TABLE profiles (
               id INT AUTO_INCREMENT PRIMARY KEY,
               user_id INT NOT NULL,
               avatar_url VARCHAR(100),
               bio TEXT,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               FOREIGN KEY (user_id) REFERENCES users(id)
           );
           CREATE TABLE friendships (
               id INT AUTO_INCREMENT PRIMARY KEY,
               requester_id INT NOT NULL,
               receiver_id INT NOT NULL,
               state ENUM('accepted', 'refused', 'pending'),
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               FOREIGN KEY (requester_id) REFERENCES users(id),
               FOREIGN KEY (receiver_id) REFERENCES users(id)
           );
