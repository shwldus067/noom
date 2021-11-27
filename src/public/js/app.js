// io() will find the server executing socket.io 
//   & connect socketIO to front-end
const socket=io();

const welcome=document.getElementById("welcome");
const form=welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden=true;

let roomName;

function addMessage(message){
    const ul=room.querySelector("ul");
    const li=document.createElement("li");
    li.innerText=message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input=room.querySelector("#msg input");
    const value=input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value="";
}

function handleNicknameSubmit(event){
    event.preventDefault();
    const input=room.querySelector("#name input");
    socket.emit("nickname", input.value);
}

// callback funcion with argument from the backend
function showRoom(newCount){
    const msgform=document.getElementById("msg");
    msgform.hidden=false;
    const h3=room.querySelector("h3");
    if(newCount===1)    h3.innerText=`Room ${roomName}`;
    else    h3.innerText=`Room ${roomName} (${newCount})`;
    const msgForm=room.querySelector("#msg");
    const nameForm=room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.removeEventListener("submit", firstNicknameSubmit);
    nameForm.addEventListener("submit", handleNicknameSubmit);
}

function firstNicknameSubmit(event){
    event.preventDefault();
    const input=room.querySelector("#name input");
    socket.emit("firstnickname", input.value, ()=>{
        socket.emit("enter_room", roomName, showRoom);
    });
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input=form.querySelector("input");
    // can send any user event & any arguments & callback function(last argument) 
    welcome.hidden=true;
    room.hidden=false;
    const msgform=document.getElementById("msg");
    msgform.hidden=true;
    const nameForm=room.querySelector("#name");
    nameForm.addEventListener("submit", firstNicknameSubmit);
    roomName=input.value;
    input.value="";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
    const h3=room.querySelector("h3");
    h3.innerText=`Room ${roomName} (${newCount})`;
    addMessage(`${user} joined!`);
})

socket.on("bye", (left, newCount) => {
    const h3=room.querySelector("h3");
    h3.innerText=`Room ${roomName} (${newCount})`;
    addMessage(`${left} left ㅠㅠ`);
})

// send message(argument) automatically
// i.e. same with socket.on("new_messge", (msg)=>{addMessage(msg)});
socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
    const roomList=welcome.querySelector("ul");
    roomList.innerHTML="";
    if(rooms.length===0){
        return;
    }
    rooms.forEach((room) => {
        const li=document.createElement("li");
        li.innerText=room;
        roomList.append(li);
    });
});
