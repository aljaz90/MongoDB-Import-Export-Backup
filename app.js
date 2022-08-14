const readline = require("readline-sync");
const fs = require("fs");
const express = require("express");
const app = express();
const open = require("open");

const DB = require("./db");

const PORT = 8686;


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(PORT, () => {
    console.log(`Serving dashboard at: http://localhost:${PORT}`);
    open(`http://localhost:${PORT}`);
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