const { MongoClient } = require("mongodb");

module.exports = class DB {
    constructor(url) {
        this.url = url;
    }
    
    async selectDatabase(databaseName) {
        this.databaseName = databaseName;
        this.db = this.client.db(this.databaseName);
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

    import() {

    }

    async export() {
        let dataToBeExported = {
            dbName: this.databaseName,
            timestamp: new Date().toISOString(),
            collections: []
        };

        let collections = await this.db.collections();
        for (let collection of collections) {
            console.log(`-Exporting ${collection.collectionName}`);
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
        await fs.writeFileSync(`./exports/MongoDB-export-${this.databaseName}_${shortDateString}.json`, data);
        console.log("Export completed");
    }

    async closeConnection() {
        await this.client.close();
    }
}