import http from "http";
// import {WebSocketServer} from "ws";
import express from "express";
import SocketIO from "socket.io";
import {instrument} from "@socket.io/admin-ui";
import {Server} from "socket.io";

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

function publicRooms(){
    const {
        sockets: {
            adapter: {sids, rooms},
        },
    }=wsServer;
    // const sids=wsServer.sockets.adapter.sids;
    // const rooms=wsServer.sockets.adapter.rooms;
    const publicRooms=[];
    rooms.forEach((_, key) => {
        if(sids.get(key)===undefined){
            publicRooms.push(key);
        }
    })
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size
}

wsServer.on("connection", (socket) => {
    wsServer.sockets.emit("room_change", publicRooms());
    // can get any name of event(emitted on the front-end)
    // server call the call-back function on the back-end
    //  but the function executed on the front-end
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        // join the room
        socket.join(roomName);
        done(countRoom(roomName));
        // send messages to roommate except me
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        // sned messages to all the sockets
        wsServer.sockets.emit("room_change", publicRooms());
    });
    // send "bye" message to roommate before disconnected
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room)-1));
    });
    
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });

    socket.on("nickname", (nickname) => (socket["nickname"]=nickname));

    socket.on("firstnickname", (nickname, done) => {
        socket["nickname"]=nickname;
        done();
    })
    
});

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