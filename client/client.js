const MessageTypes = {
  userAdded: "userAdded",
  welcome: "welcome",
  draw: "draw",
  clearUserStroke: "clearUserStroke",
  userLeft: "userLeft",
};

let isDrawing = false;
const canvas = document.querySelector("svg");
let svgPath;

// Use wss:// if the page is served over HTTPS
const socket = setupWebSocket();

setupUI();

function setupUI() {
  // Choose a random color for the stroke
  stroke.value = getRandomHexColor();

  // Handle the three life cycle events for non-touch devices
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", drawing);
  canvas.addEventListener("mouseup", finishDrawing);

  // Handle the three life cycle events for touch devices
  canvas.addEventListener("touchstart", startDrawing);
  canvas.addEventListener("touchmove", drawing);
  canvas.addEventListener("touchend", finishDrawing);

  // Clear the paths drawn by current user when the clear button is clicked
  clear.addEventListener("click", () => {
    sendMessage(MessageTypes.clearUserStroke);
  });
}

function setupWebSocket() {
  const socketUrl = location.protocol === "https:" ? "wss://" : "ws://";
  const socket = new WebSocket(`${socketUrl}old-lobster-87.deno.dev`);

  // Setup handling of incoming messages
  socket.onmessage = handleMessagesFromWebsocket;

  return socket;
}

function handleMessagesFromWebsocket(event) {
  const _data = JSON.parse(event.data);
  const { type, userId, message } = _data;
  switch (type) {
    case "userAdded":
      info.textContent = `${userId} joined, ${_data.users.length} in room`;
      break;
    case "welcome":
      username.textContent = `Username: ${userId}`;
      _data.paths.map(({ stroke, d, userId }) => {
        drawPath(stroke, d, userId);
      });
      break;
    case "draw":
      info.textContent = `${userId} added line`;
      drawPath(_data.stroke, _data.d, _data.userId);
      break;
    case "clearUserStroke":
      info.textContent = `removeUserStroke ${userId} lines`;
      break;
    case "userLeft":
      info.textContent = `${userId} left, ${users.length} in room`;
      break;
    default:
      console.error("Unknown message type: ", type);
      break;
  }

  // Log messages, if any, from the server
  if (message) {
    console.info(`Message from server: ${message}`);
  }
}

function createNewPath() {
  svgPath = `path${Date.now()}`;
  canvas.innerHTML += `<path id="${svgPath}" d="" stroke="${stroke.value}" stroke-width="2" fill="none" />`;
}

function startDrawing(event) {
  isDrawing = true;
  createNewPath();
  drawing(event);
}

function finishDrawing() {
  isDrawing = false;
  try {
    const pathElement = document.querySelector(`#${svgPath}`);
    const d = pathElement.getAttribute("d");
    sendMessage(MessageTypes.draw, { stroke: stroke.value, d });
  } catch (e) {
    console.log(e.message);
  }
}

/**
 * Sends a message through the socket by converting the data into a JSON string.
 *
 * @param {string} type - The type of message being sent.
 * @param {object} data - The data payload to be sent.
 */
function sendMessage(type, data) {
  try {
    if (data) {
      socket.send(JSON.stringify({ type, ...data }));
    } else {
      socket.send(JSON.stringify({ type }));
    }
  } catch (e) {
    console.log(e.message);
  }
}

/**
 * Draws on the canvas based on the event coordinates.
 *
 * @param {Event} event - The event triggering the drawing action.
 */
function drawing(event) {
  // Only draw if the user is currently drawing
  if (!isDrawing) return;

  // Build up the path using coordinates from the event
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX || event.touches[0].clientX) - rect.left;
  const y = (event.clientY || event.touches[0].clientY) - rect.top;
  const pathElement = document.querySelector(`#${svgPath}`);
  let d = pathElement.getAttribute("d");
  d += ` ${d === "" ? "M" : "L"} ${x} ${y}`;
  pathElement.setAttribute("d", d);
}

/**
 * Draws a path on the canvas with the given stroke and path data.
 *
 * @param {string} stroke - The color of the stroke.
 * @param {string} pathData - The path data to draw.
 */
function drawPath(stroke, d, userId) {
  canvas.innerHTML += `<path id="${svgPath}" d="${d}" stroke="${stroke}" stroke-width="2" fill="none" data-user-id="${userId}" />`;
}

/**
 * Generates a random hexadecimal color code.
 *
 * @return {string} The random hexadecimal color code generated.
 */
function getRandomHexColor() {
  // Generate a random integer between 0 and 255 for each color component
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);

  // Convert each component to a two-digit hexadecimal string
  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}
