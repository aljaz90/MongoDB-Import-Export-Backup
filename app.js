const readline = require("readline-sync");
const fs = require("fs");
const express = require("express");
const app = express();
const open = require("open");
const bodyParser = require("body-parser");

const DB = require("./db");

const PORT = 8686;

let connection = null;

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json('application/json'));

app.get("/", async (_, res) => {
    let databases = [];
    let connected = false;

    if (connection) {
        connected = true;
        databases = await connection.getDatabases();
    }

    res.render("index", { database: JSON.stringify({ connected: connected, databases: databases }) });
});

app.post("/connect", async (req, res) => {
    if (connection) {
        await connection.closeConnection();
        connection = null;
        res.json({
            connected: false
        });
    }
    else {
        let newConnection = new DB(req.body.databaseUrl);

        if (await newConnection.establishConnection()) {
            connection = newConnection;
            let databases = await connection.getDatabases();

            res.json({
                connected: true,
                databases: databases
            });
        }
        else {
            res.status(400).json({
                connected: false
            });
        }
    }
});

app.post("/select", async (req, res) => {
    if (!connection) {
        return res.status(400).send("Connection with the MongoDB instance not established")
    }

    try {
        let collections = null;

        if (connection.getSelectedDatabase() === req.body.dbName) {
            connection.selectDatabase(null);
        }
        else {
            connection.selectDatabase(req.body.dbName);
            collections = await connection.getCollections();
        }

        res.json({
            collections: collections
        });        
    } 
    catch (error) {
        res.status(400).send("An error occured while trying to get collections");
    }
});

app.listen(PORT, () => {
    console.log(`Serving dashboard at: http://localhost:${PORT}`);
    // open(`http://localhost:${PORT}`);
})


// const url = readline.question("Enter MongoDB instance url: ") || "mongodb://localhost:27017";


/*
(async () => {
    try {
        const dbName = readline.question("Enter database name: ") || "test";

        const db = new DB(url, dbName);
        await db.establishConnection();

        console.log("1 - Import");
        console.log("2 - Export");
        
        let action = readline.question("Select action: ");
        while (action != 1 && action != 2) {
            console.log("Invalid action!");
            console.log("1 - Import");
            console.log("2 - Export");
            action = readline.question("Select action: ");
        }

        if (action == 1) {
            let databaseArchivePath = readline.question("Enter database archive path: ");
            await db.import(databaseArchivePath);
        }
        else if (action == 2) {
            await db.export();
        }
        
        await db.closeConnection();

        // const client = new MongoClient(url);
        // // Database Name
    
        // await client.connect();
        // console.log("Successfully connected to the database");
        // const db = client.db(dbName);

        
        // let collections = await db.collections();
        // for (let collection of collections) {
        //     console.log(collection.collectionName)
        // }

        // const collection = db.collection('documents');
    } 
    catch (error) {
        console.log("An error occured while trying to import/export data");
        console.log(error);    
    }
})();*/