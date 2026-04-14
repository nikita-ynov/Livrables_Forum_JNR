CREATE DATABASE IF NOT EXISTS forumDb CHARACTER SET utf8mb4_unicode_ci;
       use forumDb;
           CREATE TABLE users (
               id INT AUTO_INCREMENT PRIMARY KEY,
               username VARCHAR(50) NOT NULL UNIQUE,
               email VARCHAR NOT NULL UNIQUE,
               password VARCHAR NOT NULL,
               role ENUM,
               is_banned BOOLEAN,
               created_at TIMESTAMP
           );
           CREATE TABLE topics (
               id INT AUTO_INCREMENT PRIMARY KEY,
               user_id INT NOT NULL,
               title VARCHAR(100),
               body TEXT,
               status ENUM,
               visibility ENUM,
               created_at TIMESTAMP,
               updated_at TIMESTAMP
           );
           CREATE TABLE tags (
               id INT AUTO_INCREMENT PRIMARY KEY,
               name VARCHAR(50)
           );
           CREATE TABLE topic_tag (
               id INT AUTO_INCREMENT PRIMARY KEY,
               topic_id INT NOT NULL,
               tags_id INT NOT NULL
           );
           CREATE TABLE messages (
               id INT AUTO_INCREMENT PRIMARY KEY,
               topic_id INT NOT NULL,
               user_id INT NOT NULL,
               body TEXT,
               created_at TIMESTAMP,
               updated_at TIMESTAMP
           );
           CREATE TABLE vote (
               id INT AUTO_INCREMENT PRIMARY KEY,
               message_id INT NOT NULL,
               user_id INT NOT NULL,
               type ENUM
           );
           CREATE TABLE profiles (
               id INT AUTO_INCREMENT PRIMARY KEY,
               user_id INT NOT NULL,
               avatar_url VARCHAR(100),
               bio TEXT,
               created_at TIMESTAMP
           );
           CREATE TABLE friendships (
               id INT AUTO_INCREMENT PRIMARY KEY,
               requester_id INT NOT NULL,
               receiver_id INT NOT NULL,
               status ENUM,
               created_at TIMESTAMP
           );
