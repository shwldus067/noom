import http from "http";
// import {WebSocketServer} from "ws";
import express from "express";
import SocketIO from "socket.io";

const app=express();

app.set("view engine", "pug");
app.set("views", __dirname+"/views");
app.use("/public", express.static(__dirname+"/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`)

// websocket server on http server to handle on the same port
const httpServer=http.createServer(app);
const wsServer=SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    // can get any name of event(emitted on the front-end)
    // server call the call-back function on the back-end
    //  but the function executed on the front-end
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        // join the room
        socket.join(roomName);
        done();
    });
})

/*
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
}); */

httpServer.listen(3000, handleListen);