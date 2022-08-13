const { MongoClient } = require("mongodb");
const readline = require("readline-sync");
const fs = require('fs');

class DB {
    constructor(url, databaseName) {
        this.url = url;
        this.databaseName = databaseName;
    }

    async establishConnection() {
        try {
            this.client = new MongoClient(this.url);
            await this.client.connect();
            console.log("Successfully connected to the database");
            this.db = this.client.db(this.databaseName);            
        } 
        catch (error) {
            console.log("An error occured while trying to connect to the database");
            console.log(error);  
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














const url = readline.question("Enter MongoDB instance url: ") || "mongodb://localhost:27017";

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
})();