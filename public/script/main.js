let database = {
    connected: false,
    databases: [],
    selectedDbName: null,
    collections: []
}

async function handleConnect(e) {
    e.preventDefault();

    try {
        const data = {
            databaseUrl: e.target.elements.url.value
        };

        let res = await (await fetch("/connect", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })).json();

        database.connected = res.connected;
        database.databases = res.connected ? res.databases : [];
    } 
    catch (error) {
        console.error("An error occured while trying to connect to the server");
        console.log(error);
        database.connected = false;
        database.databases = [];
    }

    database.collections = [];
    database.selectedDbName = null;

    updateConnectionStatus();
    updateDatabaseList();
    updateCollectionList();
}

async function handleSelectDatabase(dbName) {
    try {
        const data = {
            dbName: dbName
        };

        let res = await (await fetch("/select", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })).json();
        
        if (res.collections) {
            database.selectedDbName = dbName;
            database.collections = res.collections;
        }
        else {
            database.selectedDbName = null;
            database.collections = [];    
        }
    } 
    catch (error) {
        console.error("An error occured while trying to connect to the server");
        console.log(error);
        database.selectedDbName = null;
        database.collections = [];
    }

    updateCollectionList();
    updateActionButtons();
}

function updateConnectionStatus() {
    if (database.connected) {
        document.querySelector(".connect--status--text").innerText = "Connected";
        document.querySelector(".connect--status--icon").className = "connect--status--icon connect--status--icon-connected";
        document.querySelector("#urlInput").disabled = true;
        document.querySelector("#connectButton").value = "Disconnect";
        document.querySelector("#connectButton").style.backgroundColor = "#E02626";
    }
    else {
        document.querySelector(".connect--status--text").innerText = "Disconnected";
        document.querySelector(".connect--status--icon").className = "connect--status--icon connect--status--icon-disconnected";
        document.querySelector("#urlInput").disabled = false;
        document.querySelector("#connectButton").disabled = false;
        document.querySelector("#connectButton").value = "Connect";
        document.querySelector("#connectButton").style.backgroundColor = "#10aa50";
    }
}

function updateDatabaseList() {
    let databasesList = document.querySelector(".databases--list");
    let databasesHelper = document.querySelector(".databases--help");
    databasesList.replaceChildren();

    if (database.databases.length) {
        databasesHelper.style.display = "none";
    }
    else {
        databasesHelper.style.display = "flex";
    }

    for (let db of database.databases) {
        let item = document.createElement("div");
        item.id = `${db.name}-db-select-btn`;
        item.classList.add("databases--list--item");
        item.onclick = () => handleSelectDatabase(db.name);
        
        let name = document.createElement("div");
        name.classList.add("databases--list--item--name");
        name.innerText = db.name;
        item.appendChild(name);
        
        let size = document.createElement("div");
        size.classList.add("databases--list--item--size");
        size.innerText = `${db.sizeOnDisk} B`;
        item.appendChild(size);

        databasesList.appendChild(item);
    }
}

function updateActionButtons() {  
    let databaseBtns = document.querySelectorAll(".databases--list--item");
    for (let btn of databaseBtns) {
        if (btn.id === `${database.selectedDbName}-db-select-btn`) {
            btn.className = "databases--list--item databases--list--item-selected";
        }
        else {
            btn.className = "databases--list--item";
        }
    }
}

function updateCollectionList() {
    let collectionList = document.querySelector(".collections--list");
    let collectionHelper = document.querySelector(".collections--help");
    collectionList.replaceChildren();

    if (database.collections.length || database.selectedDbName) {
        collectionHelper.style.display = "none";
    }
    else {
        collectionHelper.style.display = "flex";
    }

    for (let collection of database.collections) {
        let item = document.createElement("div");
        item.classList.add("collections--list--item");
        
        let name = document.createElement("div");
        name.classList.add("collections--list--item--name");
        name.innerText = collection.name;
        item.appendChild(name);
        
        let documents = document.createElement("div");
        documents.classList.add("collections--list--item--documents");
        documents.innerText = `${collection.documentCount} documents`;
        item.appendChild(documents);

        collectionList.appendChild(item);
    }
}