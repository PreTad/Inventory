import { Outlet } from "react-router-dom";
import SideNav from "./sidenav";

const HomePage = () =>{
    return (
        <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] h-screen overflow-hidden bg-white font-sans">
            <SideNav />
            <main className="overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}

export default HomePage;
