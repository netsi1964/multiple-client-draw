const clients = new Set<WebSocket>();

Deno.serve((req) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response(null, { status: 501 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.addEventListener("open", () => {
    clients.add(socket);
    console.log("a client connected!");
  });

  socket.addEventListener("message", (event) => {
    const data = event.data;
    console.log("message", data);
    // Broadcast the message to all connected clients except the sender
    for (const client of clients) {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });

  socket.addEventListener("close", () => {
    clients.delete(socket);
    console.log("a client disconnected");
  });

  socket.addEventListener("error", (e) => {
    console.error("WebSocket error:", e);
    clients.delete(socket);
  });

  return response;
});
