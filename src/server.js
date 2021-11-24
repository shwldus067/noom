import http from "http";
import {WebSocketServer} from "ws";
import express from "express";

const app=express();

app.set("view engine", "pug");
app.set("views", __dirname+"/views");
app.use("/public", express.static(__dirname+"/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`)

// websocket server on http server to handle on the same port
const server=http.createServer(app);
const wss=new WebSocketServer({server});

const sockets=[];

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"]="Annon";
    console.log("Connected to server");
    socket.on("close", () => console.log("Disconnected from the Browser ❌"));
    socket.on("message", (msg) => {
        const message=JSON.parse(msg);
        switch(message.type){
            case "new_message":
                sockets.forEach((aSocket) => 
                    aSocket.send(`${socket.nickname}: ${message.payload}`)
                );
                break;
            case "nickname":
                socket["nickname"]=message.payload;
                break;
        }
    });
});

server.listen(3000, handleListen);