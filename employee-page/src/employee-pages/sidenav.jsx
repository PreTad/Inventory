import { NavLink } from "react-router-dom";
import { AiFillProduct, AiFillBook, AiFillDashboard, AiOutlineMenu, AiOutlineClose,AiOutlineLineChart } from 'react-icons/ai';
import { useState } from "react";

const navItems = [
    { label: 'Products', to: '/home', icon: <AiFillProduct />, end: true },
    { label: 'Dashboard', to: '/home/dashboard', icon: <AiOutlineLineChart fontWeight={20} /> },
    { label: 'Something', to: '/home/sth', icon: <AiFillDashboard /> },
];

const SideNav = () => {
    const [navShow, setNavShow] = useState(false);

    const toggleNav = () => {
        setNavShow(!navShow);
    };

    return (
        <>
            {!navShow && (
                
                <button 
                    onClick={toggleNav} 
                    className="fixed top-4 left-4 z-40 md:hidden text-green-600 bg-gray-200 rounded w-8 align-center drop-shadow-2xl"
                >
                    <AiOutlineMenu size={30} />
                </button>
            )}

            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-green-600 text-white font-semibold transition-transform duration-300 ease-in-out
                ${navShow ? "translate-x-0" : "-translate-x-full"}
                md:relative md:translate-x-0 md:flex md:flex-col md:min-h-screen md:w-full 
            `}>
                
                <div className="flex items-center justify-between p-4 border-b border-stone-100">
                    <div className="text-2xl font-bold ">Menu</div>

                    <button onClick={toggleNav} className="md:hidden">
                        <AiOutlineClose size={25} />
                    </button>
                </div>
                <nav className="flex flex-col gap-2 px-2 mt-4">
                    {navItems.map((item) => (
                        <NavLink
                            to={item.to}
                            key={item.label}
                            end={item.end}
                            onClick={() => setNavShow(false)} // Close sidebar when link is clicked on mobile
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-md transition-colors ${
                                    isActive ? 'bg-green-700' : 'hover:bg-green-500'
                                }`
                            }
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="ml-3">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Overlay for mobile - closes sidebar when clicking outside */}
            {navShow && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={toggleNav}
                ></div>
            )}
        </>
    );
};

export default SideNav;
