let database = {
    connected: false,
    databases: []
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

    updateConnectionStatus();
    updateDatabaseList();
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
    databasesList.replaceChildren();

    for (let db of database.databases) {
        let item = document.createElement("div");
        item.classList.add("databases--list--item");
        
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