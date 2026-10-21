import React from "react";
import AppRoutes from "../routes/AppRoutes";
import { Analytics } from "@vercel/analytics/react";
import { useSessionHeartbeat } from "../hooks/useSessionHeartbeat";
import { useUserSocket } from "../hooks/useUserSocket";

function App() {
  useSessionHeartbeat();
  useUserSocket();

  return (
    <>
      <AppRoutes />
      <Analytics />
    </>
  );
}

export default App;