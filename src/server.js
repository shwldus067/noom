import http from "http";
import express from "express";
import SocketIO from "socket.io";
import { doesNotMatch } from "assert";

const app=express();

app.set("view engine", "pug");
app.set("views", __dirname+"/views");
app.use("/public", express.static(__dirname+"/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));


// websocket server on http server to handle on the same port
const httpServer=http.createServer(app);
const wsServer=SocketIO(httpServer);

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size
}

wsServer.on("connection", (socket) => {
    socket.on("check_room", (roomName, done) => {
        const count=countRoom(roomName);
        done(count);
    })
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome", socket.nickname);
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
    socket.on("leave", (roomName) => {
        console.log("leaving "+socket.nickname);
        socket.broadcast.to(roomName).emit("exit", socket.nickname);
        socket.leave(roomName);
    });
    socket.on("nickname", (nickname, done) => {
        socket["nickname"]=nickname;
        done();
    })
    socket.on("disconnecting", () => {
        console.log("disconnecting "+socket.nickname);
        socket.rooms.forEach(room => socket.to(room).emit("exit", socket.nickname));
    });
})

const handleListen = () => console.log(`Listening on http://localhost:3000`)
httpServer.listen(3000, handleListen);