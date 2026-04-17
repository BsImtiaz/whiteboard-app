import { useRef, useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://whiteboard-app-1-oiuz.onrender.com/");

export default function Whiteboard() {
  const canvasRef = useRef();
  const ctxRef = useRef();

  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(3);
  const [tool, setTool] = useState("pen");

  const colors = [
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
  ];

  let drawing = false;

  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctxRef.current = ctx;

    socket.on("draw", (data) => {
      drawLine(
        data.x0,
        data.y0,
        data.x1,
        data.y1,
        false,
        data.color,
        data.size
      );
    });
  }, []);

  const drawLine = (
    x0,
    y0,
    x1,
    y1,
    emit = true,
    drawColor = color,
    drawSize = size
  ) => {
    const ctx = ctxRef.current;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;

    socket.emit("draw", {
      x0,
      y0,
      x1,
      y1,
      color: drawColor,
      size: drawSize,
    });
  };

  const start = (e) => {
    drawing = true;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lastX = offsetX;
    ctxRef.current.lastY = offsetY;
  };

  const end = () => (drawing = false);

  const draw = (e) => {
    if (!drawing) return;

    const { offsetX, offsetY } = e.nativeEvent;

    const drawColor = tool === "eraser" ? "#ffffff" : color;

    drawLine(
      ctxRef.current.lastX,
      ctxRef.current.lastY,
      offsetX,
      offsetY,
      true,
      drawColor,
      size
    );

    ctxRef.current.lastX = offsetX;
    ctxRef.current.lastY = offsetY;
  };

  const clearBoard = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(to right, #0f172a, #1e293b)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 🔥 TOOLBAR */}
      <div
        style={{
          width: "100%",
          background: "#1e293b",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h3 style={{ color: "white", margin: 0 }}>Whiteboard</h3>

          {colors.map((c) => (
            <div
              key={c}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                border:
                  color === c && tool === "pen"
                    ? "3px solid white"
                    : "2px solid #334155",
              }}
            />
          ))}
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <input
            type="range"
            min="1"
            max="20"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />

          <button
            onClick={() => setTool("pen")}
            style={{
              padding: "6px 12px",
              background: tool === "pen" ? "#22c55e" : "#334155",
              color: "white",
              border: "none",
              borderRadius: "6px",
            }}
          >
            Pen
          </button>

          <button
            onClick={() => setTool("eraser")}
            style={{
              padding: "6px 12px",
              background: tool === "eraser" ? "#ef4444" : "#334155",
              color: "white",
              border: "none",
              borderRadius: "6px",
            }}
          >
            Eraser
          </button>

          <button
            onClick={clearBoard}
            style={{
              padding: "6px 12px",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "6px",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* 🎨 CANVAS */}
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseUp={end}
        onMouseMove={draw}
        style={{
          background: "white",
          display: "block",
          cursor: tool === "eraser" ? "crosshair" : "pointer",
        }}
      />
    </div>
  );
}