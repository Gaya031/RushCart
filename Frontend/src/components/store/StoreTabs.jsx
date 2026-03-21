import React from 'react'
import { NavLink, useParams } from 'react-router-dom';


const tabs = [
  {label: "Products", path:""},
  {label: "Reviews", path: "reviews"},
  {label: "Promotions", path: "promotions"},
  {label: "About", path: "about"},
];

const StoreTabs = () => {
  const {storeId } = useParams();
  return (
    <div className="border-b border-white/10 bg-[#0b0b0b]">
      <div className="max-w-7xl mx-auto px-6 flex gap-6">
        {tabs.map(tab => (
          <NavLink
            key={tab.label}
            to={`/store/${storeId}/${tab.path}`}
            end={tab.path === ""}
            className={({ isActive }) =>
              `py-4 text-sm font-medium transition ${
                isActive
                  ? "border-b-2 border-amber-300 text-amber-200"
                  : "text-white/60 hover:text-white"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default StoreTabs
