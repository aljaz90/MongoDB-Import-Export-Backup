const { MongoClient } = require("mongodb");
const readline = require("readline-sync");

class DB {
    constructor(url, databaseName) {
        this.url = url;
        this.databaseName = databaseName;
    }

    async establishConnection() {
        try {
            this.client = new MongoClient(this.url);
            await client.connect();
            console.log("Successfully connected to the database");
            this.db = client.db(this.databaseName);
        } 
        catch (error) {
            console.log("An error occured while trying to connect to the database");
            console.log(error);  
        }
    }

    import() {

    }

    export() {

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
        const action = readline.question("Select action: ")

        if (action == 1) {

        }
        else {

        }

        // const client = new MongoClient(url);
        // // Database Name
    
        // await client.connect();
        // console.log("Successfully connected to the database");
        // const db = client.db(dbName);

        
        let collections = await db.collections();
        for (let collection of collections) {
            console.log(collection.collectionName)
        }

        // const collection = db.collection('documents');
        await client.close();
    } 
    catch (error) {
        console.log("An error occured while trying to connect to the database");
        console.log(error);    
    }
})();