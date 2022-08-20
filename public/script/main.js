let database = {
    connected: false,
    databaseUrl: "",
    databases: [],
    selectedDbName: null,
    collections: []
};

let notification = null;

async function handleConnect(e) {
    e.preventDefault();

    try {
        const data = {
            databaseUrl: e.target.elements.url.value
        };

        let res = await fetch("/connect", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        let resData = await res.json();

        if (res.status !== 200) throw new Error(res.statusText);

        database.connected = resData.connected;
        database.databases = resData.connected ? resData.databases : [];
        if (resData.connected) {
            database.databaseUrl = data.databaseUrl;
            showNotification("Connected to the MongoDB instance");
        }
        else {
            showNotification("Disconnected from the MongoDB instance", "warning");
        }
    } 
    catch (error) {
        showNotification("An error occured while trying to connect to the MongoDB instance", "error");
        console.error("An error occured while trying to connect to the server");
        console.log(error);
        database.connected = false;
        database.databases = [];
    }

    database.collections = [];
    database.selectedDbName = null;

    updateConnectionStatus();
    updateActionButtons();
    updateDatabaseList();
    updateCollectionList();
}

async function handleSelectDatabase(dbName) {
    try {
        const data = {
            dbName: dbName
        };

        let res = await fetch("/select", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (res.status !== 200) throw new Error(res.statusText);

        let resData = await res.json();
        
        if (resData.collections) {
            database.selectedDbName = dbName;
            database.collections = resData.collections;
        }
        else {
            database.selectedDbName = null;
            database.collections = [];    
        }
    } 
    catch (error) {
        console.error("An error occured while trying to connect to the server");
        console.log(error);
        showNotification("An error occured while trying to get database collections", "error");
        database.selectedDbName = null;
        database.collections = [];
    }

    updateCollectionList();
    updateActionButtons();
}

// Export (popup) functions
function handleOpenExportPopup() {
    let popup = document.querySelector(".export_popup");
    let popupCollectionList = document.querySelector(".export_popup--form--collection_list");
    popupCollectionList.replaceChildren();

    for (let collection of database.collections) {
        let item = document.createElement("div");
        item.className = "export_popup--form--collection_list--item";

        let input = document.createElement("input");
        input.type = "checkbox";
        input.name = `${collection.name}Collection`;
        input.id = `${collection.name}Collection`;
        input.value = collection.name;
        input.checked = true;
        item.appendChild(input);

        let label = document.createElement("label");
        label.innerText = collection.name;
        label.htmlFor = `${collection.name}Collection`;
        item.appendChild(label);

        popupCollectionList.appendChild(item);
    }

    popup.style.display = "block";
}

function handleCloseExportPopup() {
    let popup = document.querySelector(".export_popup");
    popup.style.display = "none";
}

async function handleExport(e) {
    e.preventDefault();

    document.querySelector(".export_popup--form--submit").disabled = true;
    document.querySelector(".export_popup--form--submit").classList.add("btn-loading");

    let collectionsToBeExported = [];

    for (let el of e.target.elements) {
        if (el.type === "checkbox" && el.checked) {
            collectionsToBeExported.push(el.value);
        }
    }

    try {
        const data = {
            collections: collectionsToBeExported
        };

        let res = await fetch("/export", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (res.status !== 200) throw new Error(res.statusText);

        let resData = await res.json();

        showNotification("Database successfully exported");

        let a = document.createElement("a");
        a.href = `/${resData.fileName}`;
        a.download  = resData.fileName;
        a.click();
    } 
    catch (error) {
        console.log("An error occured while trying to export a database");    
        console.log(error);
        showNotification("An error occured while trying to export a database", "error");
    }
    
    document.querySelector(".export_popup--form--submit").classList.remove("btn-loading");
    document.querySelector(".export_popup--form--submit").disabled = false;
}

// Import (popup) functions
function handleOpenImportPopup() {
    let popup = document.querySelector(".import_popup");
    popup.style.display = "block";
}

function handleCloseImportPopup() {
    let popup = document.querySelector(".import_popup");
    popup.style.display = "none";
}

function handleSelectFile(e) {
    let fileName = e.target.value.split("\\")[2];
    let label = document.querySelector(".import_popup--form--file--label");
    label.style.fontSize = "2.1rem"
    if (fileName.length > 45) {
        label.innerText = fileName.slice(0, 45) + "...";
    }
    else {
        label.innerText = fileName;
    }
}

async function handleImport(e) {
    e.preventDefault();

    document.querySelector(".import_popup--form--submit").disabled = true;
    document.querySelector(".import_popup--form--submit").classList.add("btn-loading");


    let input = document.querySelector("#importFile");
    let overwriteDatabaseInput = document.querySelector("#overwriteCollections");

    try {
        let data = new FormData();
        data.append("file", input.files[0]);
        data.append("overwriteDatabase", overwriteDatabaseInput.checked);

        let res = await fetch("/import", {
            method: "POST",
            body: data
        });

        if (res.status !== 200) throw new Error(res.statusText);

        let resData = await res.json();

        if (resData.dbName) {
            database.selectedDbName = resData.dbName;
            database.collections = resData.collections;
        }

        if (!database.databases.map(el => el.name).includes(resData.dbName)) {
            database.databases.push({ name: resData.dbName, sizeOnDisk: "?"});
        }

        let label = document.querySelector(".import_popup--form--file--label");
        label.style.fontSize = "3.2rem"
        label.innerText = "Select file";
    
        overwriteDatabaseInput.checked = false;

        updateDatabaseList();
        updateCollectionList();
        updateActionButtons();
        handleCloseImportPopup();

        showNotification("Database successfully imported");
    } 
    catch (error) {
        console.error("An error occured while trying to import database");
        console.log(error);
        showNotification("An error occured while trying to import a database", "error");
    }

    document.querySelector(".import_popup--form--submit").classList.remove("btn-loading");
    document.querySelector(".import_popup--form--submit").disabled = false;
}

// Update functions
function updateConnectionStatus() {
    if (database.connected) {
        document.querySelector(".connect--status--text").innerText = "Connected";
        document.querySelector(".connect--status--icon").className = "connect--status--icon connect--status--icon-connected";
        document.querySelector("#urlInput").disabled = true;
        document.querySelector("#urlInput").value = database.databaseUrl;
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

    if (database.connected) {
        document.querySelector("#import-btn").disabled = false;
    }
    else {
        document.querySelector("#import-btn").disabled = true;
    }
    
    if (database.selectedDbName) {
        document.querySelector("#export-btn").disabled = false;
    }
    else {
        document.querySelector("#export-btn").disabled = true;
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

function handleCloseNotification() {
    if (notification) {
        let notificationWrapper = document.querySelector(".notification--wrapper");
        let notificationProgress = document.querySelector(".notification--progress");

        notificationWrapper.classList.remove("notification--wrapper-animation-show");
        notificationWrapper.classList.add("notification--wrapper-animation-hide");
        notificationWrapper.style.transform = "translateY(calc(100% + 4rem))";

        notificationProgress.classList.remove("notification--progress-animation");
        
        clearTimeout(notification);
        notification = null;
    }
}

function showNotification(text, type) {
    if (notification) {
        setTimeout(() => showNotification(text, type), 1000);
        return;
    }

    let notificationElement = document.querySelector(".notification");
    let notificationWrapper = document.querySelector(".notification--wrapper");
    let notificationProgress = document.querySelector(".notification--progress");
    let notificationText = document.querySelector(".notification--text");

    notificationElement.classList.remove("notification-error");
    notificationElement.classList.remove("notification-warning");
    notificationWrapper.classList.remove("notification--wrapper-animation-hide");
    
    notificationText.innerText = text;

    if (type === "error" || type === "warning") {
        notificationElement.classList.add(`notification-${type}`);
    }

    notificationWrapper.classList.add("notification--wrapper-animation-show");
    notificationWrapper.style.transform = "translateY(0)";
    notificationProgress.classList.add("notification--progress-animation");

    notification = setTimeout(handleCloseNotification, 4000);
}