DROP DATABASE IF EXISTS task_management;

CREATE DATABASE task_management;

USE task_management;

-- 1. create Users table
CREATE TABLE Users (
	ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_fullname VARCHAR(50),
    user_description VARCHAR(255),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- 2. create Projects table
CREATE TABLE Projects (
	ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    project_description VARCHAR(255),
    project_state BOOLEAN NOT NULL,
    is_archive BOOLEAN NOT NULL,
    label VARCHAR(50),
    start_date DATE,
    end_date DATE,
    complete_date DATE,
    MANAGER_ID INT UNSIGNED NOT NULL,
    FOREIGN KEY fk_pj_us (MANAGER_ID) REFERENCES Users (ID)
);

-- 3. create Project_members table
CREATE TABLE Project_members (
	ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    PROJECT_ID INT UNSIGNED NOT NULL,
    MEMBER_ID INT UNSIGNED NOT NULL,
    FOREIGN KEY fk_pjm_pj (PROJECT_ID) REFERENCES Projects (ID),
    FOREIGN KEY fk_pjm_us (MEMBER_ID) REFERENCES Users (ID)
);

-- 4. create Task_groups table
CREATE TABLE Task_groups (
	ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(50) NOT NULL,
    PROJECT_ID INT UNSIGNED NOT NULL,
    FOREIGN KEY fk_tkg_pj (PROJECT_ID) REFERENCES Projects (ID)
);

-- 5. create Tasks table
CREATE TABLE Tasks (
	ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    task_description VARCHAR(255),
    start_date DATE,
    end_date DATE,
    complete_date DATE,
    task_state BOOLEAN NOT NULL,
    is_archive BOOLEAN NOT NULL,
    label VARCHAR(50),
    progress INT,
    PERFORMER_ID INT UNSIGNED null,
    PROJECT_ID INT UNSIGNED,
    GROUP_ID INT UNSIGNED,
    PARENT_TASK_ID INT UNSIGNED,
    FOREIGN KEY fk_tk_us (PERFORMER_ID) REFERENCES Users (ID),
    FOREIGN KEY fk_tk_pj (PROJECT_ID) REFERENCES Projects (ID),
    FOREIGN KEY fk_tk_gr (GROUP_ID) REFERENCES Task_groups (ID),
    FOREIGN KEY fk_tk_tk (PARENT_TASK_ID) REFERENCES Tasks (ID)
);

-- 6. Create Comments table
CREATE TABLE Comments (
    ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(ID),
    FOREIGN KEY (user_id) REFERENCES Users(ID)
);

-- 7. Create Task_files table
CREATE TABLE Task_files (
    ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id INT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES Tasks(ID) ON DELETE CASCADE
);

-- 8. Create Notifications table
CREATE TABLE Notifications (
    ID INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(ID)
);
