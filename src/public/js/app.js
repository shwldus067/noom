// io() will find the server executing socket.io 
//   & connect socketIO to front-end
const socket=io();

const welcome=document.getElementById("welcome");
const form=welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden=true;

let roomName;

// callback funcion with argument from the backend
function showRoom(){
    welcome.hidden=true;
    room.hidden=false;
    const h3=room.querySelector("h3");
    h3.innerText=`Room ${roomName}`
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input=form.querySelector("input");
    // can send any user event & any arguments & callback function(last argument) 
    socket.emit("enter_room", input.value, showRoom);
    roomName=input.value;
    input.value="";
}

form.addEventListener("submit", handleRoomSubmit);