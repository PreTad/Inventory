import { Outlet } from "react-router-dom";
import SideNav from "./sidenav";

const HomePage = ({ isDarkMode, onToggleDarkMode }) =>{

    
    return (
        <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] h-screen overflow-hidden bg-white dark:bg-slate-950 font-sans">
           
            <SideNav isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />
            <main className="overflow-y-auto bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 pt-16 md:pt-0">
                <Outlet />
            </main>
        </div>
    );
}

export default HomePage;
