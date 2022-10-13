const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");

module.exports = class DB {
    constructor(url) {
        this.url = url;
    }

    #serializeTypes(document) {
        let typedDoc = Array.isArray(document) ? [] : {};

        for (const [key, value] of Object.entries(document)) {
            if (value instanceof ObjectId) {
                typedDoc[key] = `O${value}`;
            }
            else if (value instanceof Date) {
                typedDoc[key] = `D${value}`;
            }
            else if (typeof value === "string") {
                typedDoc[key] = `S${value}`;
            }
            else if (value && (Array.isArray(value) || typeof value === "object")) {
                typedDoc[key] = this.#serializeTypes(value);
            }
            else {
                typedDoc[key] = value;
            }
        }

        return typedDoc;
    }

    #deserializeTypes(document) {
        let newDoc = Array.isArray(document) ? [] : {};

        for (const [key, value] of Object.entries(document)) {
            if (typeof value === "string") {
                let type = value[0];
                let val = value.slice(1);

                if (type === "S") {
                    newDoc[key] = val;
                }
                else if (type === "D") {
                    newDoc[key] = new Date(val);
                }
                else if (type === "O") {
                    newDoc[key] = new ObjectId(val);
                }
            }
            else if (value && (Array.isArray(value) || typeof value === "object")) {
                newDoc[key] = this.#deserializeTypes(value);
            }
            else {
                newDoc[key] = value;
            }
        }

        return newDoc;
    }

    getUrl() {
        return this.url;
    }
    
    selectDatabase(databaseName) {
        this.databaseName = databaseName;
        if (databaseName) {
            this.db = this.client.db(this.databaseName);
        }
        else {
            this.db = null;
        }
    }

    async establishConnection() {
        try {
            this.client = new MongoClient(this.url);
            await this.client.connect();

            console.log("Successfully connected to the database");
            return true;
        } 
        catch (error) {
            console.log("An error occured while trying to connect to the database");
            console.log(error);
            return false;
        }
    }

    async getDatabases() {
        try {
            let { databases } = await this.client.db().admin().listDatabases();
            return databases;
        } 
        catch (error) {
            console.log("An error occured while trying to list databases");
            console.log(error);
            return [];
        }
    }

    async getCollections() {
        let collections = await this.db.collections();
        let collectionData = [];

        for (let collection of collections) {
            let documentCount = await collection.countDocuments();
            collectionData.push({
                name: collection.collectionName,
                documentCount: documentCount
            })
        }

        return collectionData;
    }

    getSelectedDatabase() {
        return this.databaseName;
    }

    async export(collections, exportIndexes=true) {
        let dataToBeExported = {
            dbName: this.databaseName,
            timestamp: new Date().toISOString(),
            collections: []
        };
        
        for (let collectionName of collections) {
            let collection = await this.db.collection(collectionName);
            console.log(`-Exporting ${collectionName}`);
            const documents = await collection.find({}).toArray();

            let serializedDocuments = this.#serializeTypes(documents);

            let indexes = [];
            if (exportIndexes) {
                indexes = await collection.indexes();
            }

            let collectionData = {
                name: collection.collectionName,
                documents: serializedDocuments,
                indexes: indexes
            };
    
            dataToBeExported.collections.push(collectionData);
        }

        let currentDate = new Date();
        let shortDateString = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth()}-${currentDate.getUTCDate()}_-${currentDate.getUTCHours()}-${currentDate.getUTCMinutes()}-${currentDate.getUTCSeconds()}`;

        let data = JSON.stringify(dataToBeExported);
        let fileName = `MongoDB-export-${this.databaseName}_${shortDateString}.json`;

        if (!fs.existsSync("./exports")) {
            fs.mkdirSync("./exports");
        }

        await fs.writeFileSync(`./exports/${fileName}`, data);
        console.log(`Exported to: ./exports/${fileName}`);
        return fileName;
    }

    async import(data, overwrite) {        
        this.selectDatabase(data.dbName);
        let existingCollections = await this.getCollections();
        let collectionNames = existingCollections.map(el => el.name);

        for (let collectionData of data.collections) {
            console.log(`-Importing ${collectionData.name}`);

            let collection = this.db.collection(collectionData.name);
            if (!collectionNames.includes(collectionData.name)) {
                collection = await this.db.createCollection(collectionData.name);
            }

            if (overwrite) {
                let documentCount = await collection.countDocuments();
                if (documentCount > 0) {
                    console.log(`-DeletingMany ${collectionData.name}`);
                    await collection.deleteMany({});
                }
            }

            if (collectionData.indexes.length > 0) {
                await collection.createIndexes(collectionData.indexes);
            }

            if (collectionData.documents.length > 0) {
                let typedDocuments = this.#deserializeTypes(collectionData.documents);
                await collection.insertMany(typedDocuments, { ordered: false });
            }


        }

        console.log("Import successful");
        return data.dbName;
    }


    async closeConnection() {
        await this.client.close();
    }
}