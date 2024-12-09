Library Management API
This is a Node.js and SQLite-based API for a Library Management System. The API supports user authentication, book borrowing requests, and borrow history.

Features
User registration and login with JWT authentication.
Book borrowing functionality with validation for availability.
Borrow history retrieval for users.
Role-based access control for managing borrow requests.
Tech Stack
Backend: Node.js, Express.js
Database: SQLite
Authentication: JWT
Installation
Clone the repository:

bash
Copy code
git clone https://github.com/TharakBale/foot-owl.git
cd foot owl

Install dependencies:

npm install
Set up the SQLite database:

Create a library.db file in the root directory.
Run the SQL schema provided in schema.sql to initialize the database.


Start the server:
node index.js 

Environment Variables
Create a .env file in the root directory with the following variables:


Database Schema
Users
Column	Type	Description
id	INTEGER	Primary key
email	TEXT	User email
password	TEXT	Hashed password
role	TEXT	Role (e.g., user/admin)
Books
Column	Type	Description
id	INTEGER	Primary key
title	TEXT	Book title
quantity	INTEGER	Available quantity
Borrow Requests
Column	Type	Description
id	INTEGER	Primary key
user_id	INTEGER	Foreign key (users)
book_id	INTEGER	Foreign key (books)
start_date	TEXT	Borrow start date
end_date	TEXT	Borrow end date
status	TEXT	Request status

