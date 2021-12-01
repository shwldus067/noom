const socket=io();

const call=document.getElementById("call");
const nickname=document.getElementById("nickname");

const myFace=document.getElementById("myFace");
const muteBtn=document.getElementById("mute");
const cameraBtn=document.getElementById("camera");
const camerasSelect=document.getElementById("cameras");
const exitBtn=document.getElementById("exit");

nickname.hidden=true;
call.hidden=true;

let myStream;
let muted=false;
let cameraOff=false;
let roomName;
let myPeerConnection;
let myDataChannel;
let myNickname;

async function getCameras(){
    try{
        const devices=await navigator.mediaDevices.enumerateDevices();
        const cameras=devices.filter((device)=>device.kind==="videoinput");
        const currentCamera=myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option=document.createElement("option");
            option.value=camera.deviceId;
            option.innerText=camera.label;
            if(currentCamera.label===camera.label){
                option.selected=true;
            }
            camerasSelect.appendChild(option);
        });
    }catch(err){
        console.log(err);
    }
}

async function getMedia(deviceId){
    const initialconstraints={
        audio:true,
        video: {facingMode: "user"},
    };
    const cameraConstraints={
        audio:true,
        video: {deviceId: {exact: deviceId}}
    }
    try {
        myStream=await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints:initialconstraints
        );
        myFace.srcObject=myStream;
        if(!deviceId){
            await getCameras();
        }
    } catch(err){
        console.log(err);
    }
}

function handleMuteClick(){
    myStream.getAudioTracks().forEach((track) => (track.enabled=!track.enabled));
    if(!muted){
        muteBtn.innerText="Unmute";
        muted=true;
    }else{
        muteBtn.innerText="Mute";
        muted=false;
    }
}

function handleCameraClick(){
    myStream.getVideoTracks().forEach((track) => (track.enabled=!track.enabled));
    if(cameraOff){
        cameraBtn.innerText="Turn Camera Off";
        cameraOff=false;
    }else{
        cameraBtn.innerText="Turn Camera On";
        cameraOff=true;
    }
}

async function handleCameraChange(){
    await getMedia(camerasSelect.value);
    if(myPeerConnection){
        const videoTrack=myStream.getVideoTracks()[0];
        const videoSender=myPeerConnection.getSenders().find((sender) => sender.track.kind==="video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


// welcome form: join a room
const welcome=document.getElementById("welcome");
const welcomeForm=welcome.querySelector("form");
const nameForm=nickname.querySelector("form");

async function initCall(){
    nickname.hidden=true;
    call.hidden=false;
    const msgForm=call.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
    await getMedia();
    makeConnection();
}

async function handleNicknameSubmit(event){
    event.preventDefault();
    const input=nameForm.querySelector("input");
    myNickname=input.value;
    await initCall();
    input.value="";
    socket.emit("nickname", myNickname, () => {
        const myname=document.querySelector("#myname");
        myname.innerText=`${myNickname}`;
        socket.emit("join_room", roomName);
    })
}

async function EnterRoom(count){
    if(count==2){
        alert("Full room");
    }else{
        welcome.hidden=true;
        nickname.hidden=false;
        nameForm.addEventListener("submit", handleNicknameSubmit);
    }
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input=welcomeForm.querySelector("input");
    roomName=input.value;
    input.value="";
    socket.emit("check_room", roomName, EnterRoom);
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// socket code
function addMessage(message){
    const ul=call.querySelector("ul");
    const li=document.createElement("li");
    li.innerText=message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input=call.querySelector("#msg input");
    const value=`${myNickname}: ${input.value}`;
    addMessage(`You: ${input.value}`);
    input.value="";
    if(myDataChannel){
        myDataChannel.send(value);
    }else{
        console.log("err");
    }
}

function handleMessageReceive(event){
    addMessage(event.data);
}

socket.on("welcome", async (nickname) => {
    addMessage(`---${nickname} entered---`);
    if(!myPeerConnection){
        makeConnection();
    }
    myDataChannel=myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", handleMessageReceive);
    const offer=await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel=event.channel;
        myDataChannel.addEventListener("message", handleMessageReceive);
    });
    myPeerConnection.setRemoteDescription(offer);
    const answer=await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    myPeerConnection.addIceCandidate(ice);
});

socket.on("exit", (nickname) => {
    addMessage(`---${nickname} disconnected---`);
    const peerFace=document.getElementById("peerFace");
    const tracks=peerFace.srcObject.getTracks();
    tracks.forEach(function(track){
        track.stop();
    });
    peerFace.srcObject=null;
    if(myPeerConnection){
        myPeerConnection.ontrack=null;
        myPeerConnection.onicecandidate=null;
        myPeerConnection.close();
        myPeerConnection=null;
    }
})

function handleExit(event){
    event.preventDefault();
    socket.emit("leave", roomName);
    if(myPeerConnection){
        myPeerConnection.ontrack=null;
        myPeerConnection.onicecandidate=null;
        myPeerConnection.close();
        myPeerConnection=null;
    }
    location.replace("/");
}

exitBtn.addEventListener("click", handleExit);

// RTC code

function handleIce(data){
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){
    const peerFace=document.getElementById("peerFace");
    peerFace.srcObject=data.stream;
}

function makeConnection(){
    myPeerConnection=new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}