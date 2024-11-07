import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const clickedLogo = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-row justify-between p-3 mx-5 my-2 rounded-md border bg-black text-white border-black dark:bg-[rgb(10,10,10)] dark:border-[rgb(70,70,70,0.5)]">
      <button
        onClick={clickedLogo}
        className="mx-3 font-sans text-xl font-bold hover:underline"
      >
        AutoTendance
      </button>
      <ThemeToggle />
    </div>
  );
}

export default NavBar;
