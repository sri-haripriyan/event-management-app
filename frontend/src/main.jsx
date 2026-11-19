import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./toastConfig.js";
import "./index.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { SocketContextProvider } from "./context/socketContext.jsx";
import { Toaster } from "react-hot-toast";
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketContextProvider>
          <App />
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
              },
            }}
          />
        </SocketContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
