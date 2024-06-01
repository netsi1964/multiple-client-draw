import {
  KnownMessageTypes,
  PathData,
  SocketEvents,
  MessageTypeWelcome,
  MessageTypes,
} from "./models.ts";

const clients = new Set<WebSocket>();
let paths: PathData[] = [];
let users: string[] = [];

Deno.serve((req) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response(null, { status: 501 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.addEventListener(SocketEvents.OPEN, () => {
    // Add the client to the set of connected clients
    clients.add(socket);

    // Generate a unique user ID
    let id = Date.now().toString();
    id = id.substring(id.length - 5, 5) + Math.floor(Math.random() * 10);
    const userId = `user-${id}`;

    // Add the user ID to the list of connected users
    users.push(userId);

    // Send welcome message to the client
    sendWelcomeMessage();

    // Broadcast a user added message to all connected clients
    broadCast({ type: MessageTypes.USER_ADDED, userId, users }, false);

    socket.addEventListener(SocketEvents.MESSAGE, (event) => {
      // Handle incoming messages
      const data = JSON.parse(event.data);
      const messageType: MessageTypes = data.type;

      switch (messageType) {
        case MessageTypes.CLEAR_USER_STROKE:
          paths = paths.filter((p) => p.userId !== userId);
          broadCast(
            {
              type: MessageTypes.CLEAR_USER_STROKE,
              paths,
              userId,
            },
            false
          );
          break;
        case MessageTypes.DRAW:
          data.userId = userId;
          paths.push(data);
          broadCast(data, false);
          break;
        default:
      }
    });

    socket.addEventListener(SocketEvents.CLOSE, () => {
      removeUser();
      clients.delete(socket);
      console.log("a client disconnected");
    });

    socket.addEventListener(SocketEvents.ERROR, (e) => {
      removeUser();
      console.error("WebSocket error:", e);
      clients.delete(socket);
    });

    function sendWelcomeMessage() {
      const initialMessage: MessageTypeWelcome = {
        type: MessageTypes.WELCOME,
        userId,
        paths,
        message: `Welcome ${userId} to the collaborative drawing app!`,
      };
      socket.send(JSON.stringify(initialMessage));
    }

    function removeUser() {
      users = users.filter((user) => user !== userId);
      broadCast({ type: MessageTypes.USER_LEFT, userId, users });
    }

    function broadCast(data: KnownMessageTypes, notSender = true) {
      // Broadcast the message to all connected clients except the sender
      const json = JSON.stringify(data);
      for (const client of clients) {
        if (
          notSender &&
          client !== socket &&
          client.readyState === WebSocket.OPEN
        ) {
          client.send(json);
        }
      }
    }
  });

  return response;
});
