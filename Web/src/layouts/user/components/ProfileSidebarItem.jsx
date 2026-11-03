import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ProfileSidebarItem = ({ icon, text, expanded, path }) => {
    return (
        <NavLink 
            to={path} 
            className={({ isActive }) => 
                `flex items-center p-3 mt-2 transition-all duration-300 ease-in-out transform 
                ${isActive ? 'bg-teal-600 text-white shadow-sm' 
                : 'hover:bg-teal-600 hover:text-white'} cursor-pointer mx-4 rounded-lg`
            }
        >
            <div className="flex items-center justify-center">{icon}</div>
            {expanded && <span className="ml-4">{text}</span>}
            {expanded && <ChevronRight className="ml-auto" size={16} />}
        </NavLink>
    );
};

export default ProfileSidebarItem;