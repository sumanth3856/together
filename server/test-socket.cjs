const { io } = require("socket.io-client");
const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("Connected as", socket.id);
  socket.emit("create_room", { userId: "user1", nickname: "tester" }, (res) => {
    console.log("Room created", res);
    if(res.success) {
      socket.emit("send_chat", { text: "Hello World" });
      socket.emit("add_to_queue", { youtubeId: "12345", title: "Test Vid" });
      setTimeout(() => {
        socket.emit("send_chat", { text: "Another message" });
        setTimeout(() => {
          socket.disconnect();
          process.exit();
        }, 1000);
      }, 500);
    } else {
      process.exit(1);
    }
  });
});
socket.on("chat_received", (msg) => console.log("Chat:", msg));
socket.on("room_state_updated", (state) => console.log("State Updated:", state));
