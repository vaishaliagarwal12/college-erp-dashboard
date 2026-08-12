const { Server } = require("socket.io");
const config = require("./config");
const { verifyAccessToken } = require("./utils/token");

const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
  });

  // Authenticate the socket with the same access token used for the API
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
};

module.exports = createSocketServer;
