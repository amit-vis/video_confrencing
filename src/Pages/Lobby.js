import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import {Form, Button, Container} from 'react-bootstrap';
import './Lobby.css'

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <Container className="w-25 custom-container">
      <div className="w-100 custom-subcontainer">
      <h1>Lobby</h1>
      <Form onSubmit={handleSubmitForm}>
      <Form.Group className="mb-3" controlId="formGroupEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control type="email" placeholder="Enter email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
         />
      </Form.Group>
      <Form.Group className="mb-3" controlId="formGroupPassword">
        <Form.Label>Room Id</Form.Label>
        <Form.Control type="text" placeholder="Room Id"
        id="room"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
         />
      </Form.Group>
      <Button type="submit" variant="success">Success</Button>
    </Form>
    </div>
    </Container>
  );
};

export default LobbyScreen;
