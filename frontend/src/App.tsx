import { Route, Routes } from "react-router-dom";
import "./App.css";
import MainPage from "./pages/MainPage";
import GameScene from "./components/game-scene/game_scene";
import Footer from "@/common/Footer";

function App() {
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
