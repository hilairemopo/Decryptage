const { app, BrowserWindow, Menu } = require("electron");
const axios = require("axios");
const isDev = require("electron-is-dev");
const path = require("path");
const { spawn } = require("child_process");
let ip = "";

function createWindow() {
    const mainWindow = new BrowserWindow({
        resizable: false,
        width: 800,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    const template = [
        {
            label: "Ouvrir dans le navigateur",
            click: async () => {
                const { shell } = require("electron");
                await shell.openExternal("http://localhost:8590/");
            },
        },
        {
            label: "Aide",
            submenu: [
                {
                    label: "Guide d'installation",
                    click: async () => {
                        const { shell } = require("electron");
                        if(isDev){
                            await shell.openExternal("file:///"+path.join(process.cwd(), "dna", "installation_guide.pdf"));
                        }else{
                            await shell.openExternal("file:///"+path.join(process.cwd(),"resources", "dna","installation_guide.pdf"));
                        }
                    },
                },
                {
                    label: "Guide d'utilisation",
                    click: async () => {
                        const { shell } = require("electron");
                        if(isDev){
                            await shell.openExternal("file:///"+path.join(process.cwd(), "dna", "user_guide.pdf"));
                        }else{
                            await shell.openExternal("file:///"+path.join(process.cwd(),"resources", "dna","user_guide.pdf"));
                        }
                    },
                },
            ],
        },
    ];

    if (!isDev) {
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    let jarjar, indexHtml, loadingHtml, errorgHtml;

    if (isDev) {
        jarjar = path.join(process.cwd(), "demo", "demo-0.0.1-SNAPSHOT.jar");
        indexHtml = path.join(process.cwd(), "demo", "index.html");
        loadingHtml=path.join(process.cwd(), "demo", "loading.html");
        errorgHtml=path.join(process.cwd(), "demo", "error.html");
    } else {
        jarjar = path.join(
            process.cwd(),
            "resources",
            "demo",
            "demo-0.0.1-SNAPSHOT.jar"
        );
        indexHtml=path.join(process.cwd(),
            "resources",
            "demo", "index.html");

        loadingHtml=path.join(process.cwd(),
            "resources",
            "demo", "loading.html");

        errorgHtml=path.join(process.cwd(),
            "resources",
            "demo", "error.html");

    }

    const child = spawn("java", ["-jar", jarjar]);

    mainWindow.loadURL(indexHtml);

    child.stdout.on("data", (data) => {
        console.log(`Sortie du JAR Spring Boot : ${data}`);
        if (data.includes("Application 'Demo' is running! Access URLs:")) {
            axios
                .get("http://localhost:8590/ip")
                .then((response) => {
                    if (response) {
                        ip = response.data.ip;
                        const menu = Menu.buildFromTemplate(template);
                        Menu.setApplicationMenu(menu);
                        mainWindow.loadURL(indexHtml);
                    }
                })
                .catch((error) => {
                    if (error && error.code !== "ECONNREFUSED") {
                        mainWindow.loadURL(errorgHtml);
                    }
                });
        } else {
            console.log(`==============================================NON DEMARRER`);
        }
        if(data.includes("Port 8590 was already in use.")){
            mainWindow.loadURL(errorgHtml,{
                query: { message: "alreadyPort" },
            });
        }
    });

    mainWindow.on("closed", () => {
        child.kill();
    });
}

app.whenReady().then(createWindow);
