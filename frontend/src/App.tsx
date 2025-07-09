import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import MainPage from "./pages/MainPage";
import GameScene from "./components/game-scene/game_scene";
import Footer from "@/common/Footer";

function App() {
  const location = useLocation();

  useEffect(() => {
    // Clear session storage when navigating away from game pages
    const isGamePage = location.pathname.match(/^\/game\/[^\/]+$/);

    if (!isGamePage) {
      console.log("Clearing session storage - not on game page");
      sessionStorage.removeItem("secretNumber");
      sessionStorage.removeItem("roomId");
      sessionStorage.removeItem("roomCode");
    }
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/game/:roomId" element={<GameScene />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
