const { MongoClient } = require("mongodb");
const fs = require("fs");

module.exports = class DB {
    constructor(url) {
        this.url = url;
    }
    
    async selectDatabase(databaseName) {
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

    import() {

    }

    async export(collections) {
        let dataToBeExported = {
            dbName: this.databaseName,
            timestamp: new Date().toISOString(),
            collections: []
        };
        
        for (let collectionName of collections) {
            let collection = await this.db.collection(collectionName);
            console.log(`-Exporting ${collectionName}`);
            const documents = await collection.find({}).toArray();

            let collectionData = {
                name: collection.collectionName,
                documents: documents
            };
    
            dataToBeExported.collections.push(collectionData);
        }

        let currentDate = new Date();
        let shortDateString = `${currentDate.getUTCFullYear()}-${currentDate.getUTCMonth()}-${currentDate.getUTCDate()}_-${currentDate.getUTCHours()}-${currentDate.getUTCMinutes()}-${currentDate.getUTCSeconds()}`

        let data = JSON.stringify(dataToBeExported);
        let fileName = `MongoDB-export-${this.databaseName}_${shortDateString}.json`;
        await fs.writeFileSync(`./exports/${fileName}`, data);
        console.log(`Exported to: /exports/${fileName}`);
        return fileName;
    }

    async closeConnection() {
        await this.client.close();
    }
}