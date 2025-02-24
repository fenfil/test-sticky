const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const port = 3000;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const id = (Math.random() * 10000) | 0;
console.log("Server ID:", id);
// Serve static files
app.use(express.static("public"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send(`OK ${id}`);
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected", socket.id);

  // Send message every 5 seconds with container ID
  const intervalId = setInterval(() => {
    socket.emit("server-message", {
      message: "Hello from server",
      containerId: process.env.HOSTNAME,
      timestamp: new Date().toISOString(),
    });
  }, 5000);

  socket.on("client-message", (data) => {
    console.log("Received message:", data);
    socket.emit("server-response", {
      received: data,
      containerId: process.env.HOSTNAME,
    });
  });

  socket.on("disconnect", () => {
    clearInterval(intervalId);
    console.log("Client disconnected", socket.id);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  http.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

http.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
