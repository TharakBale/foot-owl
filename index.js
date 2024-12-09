const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());


const dbPath = path.join(__dirname, "library.db");


let db = null;


const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        app.listen(3000, () => {
            console.log("Server Running at http://localhost:3000/");
        });
    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

const authenticateToken = (request, response, next) => {
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
        return response.send("Authorization header is missing.")
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (error, user) => {
        if (error) {
            return response.send("Invalid token.");
        }
        request.user = user;
        next();
    });

};

//Create User 
app.post("/users", async (request, response) => {

    const { email, password, role } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserQuery = `
        INSERT INTO users (email,password,role)
        VALUES ('${email}', '${hashedPassword}', '${role}');
    `;

    await db.run(createUserQuery);
    response.send("User created successfully");
});

//Login API 
app.post("/login", async (request, response) => {
    const { email, password } = request.body;
    const user = await db.get(`SELECT * FROM users WHERE email = '${email}'`);

    if (!user) {
        return response.send("Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return response.send("Invalid email or password.")
    }
    const token = jwt.sign({ userId: user.indexOf, role: user.role }, JWT_SECRET, {
        expiresIn: "1h",
    });
    response.send({ token })
});

//Approve/deny Borrow Request 
app.put("/borrow-requests/:id", async (request, response) => {
    const { id } = request.params;
    const { status } = request.body;


    const updateRequestsQuery = `
        UPDATE borrow_requests 
        SET status = '${status}'
        WHERE id = ${id};
    `;

    await db.run(updateRequestsQuery);
    response.send("Borrow request updated successfully.")
});

//GET Books
app.get("/books", async (request, response) => {
    const booksQuery = "SELECT * FROM books";
    const books = await db.all(booksQuery);
    response.send(books);
});

app.post("/borrow-requests", authenticateToken, async (request, response) => {
    const { bookId, startDate, endDate } = request.body;
    const { userId } = request.user;
    const availableBooksQuery = `
        SELECT quantity FROM books WHERE id = ${bookId};
    `;
    const book = await db.get(availableBooksQuery);

    if (!book || book.quantity < 1) {
        return response.send("Book not available.")
    }

    //create borrow request
    const createrequestQuery = `
        INSERT INTO borrow_requests (user_id,book_id,start_date,end_date,status)
        VALUES (${userId},${bookId}, '${startDate}','${endDate}', 'pending');
    `;
    await db.run(createrequestQuery);

    //Decrease book quantity 
    const updateBookQuery = `
        UPDATE books SET quantity = quantity - 1 WHERE id = ${bookId};
    `;
    await db.run(updateBookQuery);
    response.send("Borrow request submitted successfully");
});

//view Borrow History 
app.get("/borrow-history", authenticateToken, async (request, response) => {
    const { userId } = request.user
    const historyQury = `
        SELECT br.id, b.title, br.start_date, br.end_date,br.status 
        FROM borrow_request br 
        JOIN books b ON br.book_id = b.id 
        WHERE br.user_id = ${userId};
    `;
    const history = await db.all(historyQury);
    response.send(history);
}); 