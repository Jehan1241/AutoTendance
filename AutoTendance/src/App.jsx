import LoginBox from "./LoginBox/LoginBox";
import NavBar from "./NavBar/NavBar";
import { Route, Routes } from "react-router-dom";
import LoggedIn from "./LoggedIn/LoggedIn";
import AdminPage from "./LoggedIn/AdminPage";
import StudentPage from "./LoggedIn/StudentPage";

function App() {
  return (
    <>
      <div className="flex overflow-y-auto flex-col w-screen h-screen dark:text-white dark:bg-[rgb(15,15,15)]">
        <NavBar />
        <Routes>
          <Route element={<LoginBox />} path="/" />
          <Route element={<LoggedIn />} path="/LoggedIn" />
          <Route element={<AdminPage />} path="/admin" />
          <Route element={<StudentPage />} path="/student" />
        </Routes>
      </div>
    </>
  );
}

export default App;
