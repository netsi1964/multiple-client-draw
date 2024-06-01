let drawing = false;
let canvas = document.querySelector("svg");

// Use wss:// if the page is served over HTTPS
const socketUrl = location.protocol === "https:" ? "wss://" : "ws://";
const socket = new WebSocket(`${socketUrl}old-lobster-87.deno.dev`);

socket.onmessage = (event) => {
  const { users, stroke, d, type, message, userId, paths } = JSON.parse(
    event.data
  );
  console.log(type, event.data);
  switch (type) {
    case "welcome":
      username.textContent = `Username: ${userId}`;
      paths.map(({ stroke, pathData }) => {
        drawPath({ stroke, pathData });
      });
      break;
    case "newUser":
      info.textContent = `${userId} joined, ${users.length} in room`;
      break;
    case "removeUserStroke":
      info.textContent = `removeUserStroke ${userId} lines`;
      break;
    case "userLeft":
      info.textContent = `${userId} left, ${users.length} in room`;
      break;
    default:
      info.textContent = `${userId} added line`;
      drawPath({ stroke, d, userId });
      break;
  }
};

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDrawing);
canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("touchmove", draw);

clear.addEventListener("click", () => {
  socket.send(JSON.stringify({ type: "clearUserStroke" }));
});

let svgPath, currentPath;
stroke.value = getRandomHexColor();

function createNewPath() {
  svgPath = `path${Date.now()}`;
  canvas.innerHTML += `<path id="${svgPath}" d="" stroke="${stroke.value}" stroke-width="2" fill="none" />`;
}

function startDrawing(event) {
  drawing = true;
  createNewPath();
  draw(event);
}

function stopDrawing() {
  drawing = false;
  try {
    const pathElement = document.querySelector(`#${svgPath}`);
    const pathData = pathElement.getAttribute("d");
    socket.send(JSON.stringify({ stroke: stroke.value, pathData }));
  } catch (e) {
    console.log(e.message);
  }
}

function draw(event) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX || event.touches[0].clientX) - rect.left;
  const y = (event.clientY || event.touches[0].clientY) - rect.top;
  const pathElement = document.querySelector(`#${svgPath}`);
  let d = pathElement.getAttribute("d");
  d += ` ${d === "" ? "M" : "L"} ${x} ${y}`;
  pathElement.setAttribute("d", d);
}

function drawPath({ stroke, pathData }) {
  canvas.innerHTML += `<path id="${svgPath}" d="${pathData}" stroke="${stroke}" stroke-width="2" fill="none" />`;
}

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
