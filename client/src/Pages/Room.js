import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/Peer";
import { useSocket } from "../context/SocketProvider";
import './Lobby.css'

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [isAudioPaused, setIsAudioPaused] = useState(false)
  const [isVedioPaused, setIsVedioPaused] = useState(false)


  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
  }, [isVedioPaused,myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);


  const handleAudioToggle = ()=>{
    setIsAudioPaused((prevState)=>!prevState)
  }

  const handleVideoToggle = ()=>{
    setIsVedioPaused((prevState)=>!prevState)
  }

  return (
    <div className="roomcontainer">
      <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer
            playing
            muted={isAudioPaused}
            url={isVedioPaused? myStream:null}
            className="remoteStream"
            onPause
          />
          <img src={isAudioPaused?
          "https://cdn-icons-png.flaticon.com/128/12260/12260290.png"
        :"https://cdn-icons-png.flaticon.com/128/10470/10470631.png"}
          alt="mute-icon"
          height={100}
          width={100}
          onClick={handleAudioToggle}
          className="m-2"
          />
          <img src={isVedioPaused?"https://cdn-icons-png.flaticon.com/128/2839/2839026.png"
          :"https://cdn-icons-png.flaticon.com/128/9314/9314666.png"}
          alt="mute-icon"
          height={100}
          width={100}
          onClick={handleVideoToggle}
          className="m-2"
          />
        </>
      )}
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer
            playing
            muted={isAudioPaused}
            url={isVedioPaused? remoteStream:null}
            className="remoteStream"
          />
          <img src={isAudioPaused?
          "https://cdn-icons-png.flaticon.com/128/12260/12260290.png"
        :"https://cdn-icons-png.flaticon.com/128/10470/10470631.png"}
          alt="mute-icon"
          height={100}
          width={100}
          onClick={handleAudioToggle}
          className="m-2"
          />
          <img src={isVedioPaused?"https://cdn-icons-png.flaticon.com/128/2839/2839026.png"
          :"https://cdn-icons-png.flaticon.com/128/9314/9314666.png"}
          alt="mute-icon"
          height={100}
          width={100}
          onClick={handleVideoToggle}
          className="m-2"
          />
        </>
      )}
      </div>
    </div>
  );
};

export default RoomPage;
