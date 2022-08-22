const fs = require("fs");
const express = require("express");
const app = express();
const open = require("open");
const bodyParser = require("body-parser");
const formidable = require("formidable");

const DB = require("./db");

const PORT = 8686;

let connection = null;

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/exports"));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json("application/json"));

app.get("/", async (_, res) => {
    let databases = [];
    let databaseUrl = "";
    let connected = false;
    let selectedDbName = null;
    let collections = [];

    if (connection) {
        connected = true;
        databaseUrl = connection.getUrl();
        databases = await connection.getDatabases();

        if (connection.getSelectedDatabase()) {
            selectedDbName = connection.getSelectedDatabase();

            try {
                collections = await connection.getCollections();
            } 
            catch (error) {
                console.log("An error occured while getting collections");
                console.log(error);
            }
        }
    }

    res.render("index", { database: JSON.stringify({ connected: connected, databaseUrl: databaseUrl, databases: databases, selectedDbName: selectedDbName, collections: collections }) });
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

app.post("/export", async (req, res) => {
    try {
        if (!connection || !connection.getSelectedDatabase()) {
            return res.status(400).send("Not connected to an instance or database is not selected");
        }
        
        let fileName = await connection.export(req.body.collections);
        res.json({
            fileName: fileName
        });
    } 
    catch (error) {
        console.log("An error occured while trying to export collections");
        console.log(error);
        res.status(500).json("An error occured while trying to export collections");
    }
});

app.post("/import", async (req, res) => {
    if (!connection) {
        return res.status(400).send("Not connected to an instance");
    }

    let files = [];
    let fields = {};
    let error = false;
    let form = new formidable.IncomingForm();

    form.on('file', (field, file) => {
        files.push(file);
    });
    form.on('field', (field, value) => {
        fields[field] = value;
    });
    form.on('error', err => {
        console.log("An error occured while trying parse form data");
        console.log(err);        
        error = true;
        return res.status(500).json("An error occured while trying to import database");
    });
    form.once('end', async () => {
        if (error) {
            return;
        }

        if (files.length < 1) {
            return res.status(400).json("400: Import file not recieved");
        }

        try {
            let file = files[0];
            let extension = file.originalFilename.split('.')[file.originalFilename.split('.').length - 1].toLowerCase();
            if (!["json"].includes(extension)) {
                await fs.promises.unlink(file.filepath);
                return res.status(400).send("400: File type not permitted");
            }

            let jsonString = await fs.readFileSync(file.filepath);
            let data = JSON.parse(jsonString);

            let dbName = await connection.import(data, fields["overwriteDatabase"]);
            let collections = await connection.getCollections();

            res.json({
                dbName: dbName,
                collections: collections
            });
        } 
        catch (err) {
            console.log("An error occured while trying to import database");
            console.log(err);
            res.status(500).json("An error occured while trying to import database");   
        }
    });
    form.parse(req);
});

app.listen(PORT, () => {
    console.log(`Serving dashboard at: http://localhost:${PORT}`);
    open(`http://localhost:${PORT}`);
});