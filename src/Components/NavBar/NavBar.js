import React from "react";
import apdjLogo from "../../Assets/images/APDJ.png";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <div className="w-full bg-[#111111] flex justify-between items-center px-8 font-sans sticky top-0">
      {/* Logo on the left */}
      <div className="flex justify-start items-center cursor-pointer">
        <img
          src={apdjLogo}
          className="object-contain h-32 w-48"
          alt="Company Logo"
        />
      </div>

      {/* Items aligned to the right */}
      <div className="flex justify-end items-center space-x-3 text-[#727176]">
        <Link
          to={"/"}
          className="hover:text-[#f7a44a] cursor-pointer transition duration-300"
        >
          Home
        </Link>
        <div>|</div>

        <Link
          to={"/uploader"}
          className="hover:text-[#f7a44a] cursor-pointer transition duration-300"
        >
          Uploader
        </Link>
        <div>|</div>
        <div className="cursor-pointer">
          <p>Contracts</p>
        </div>
        <div>|</div>
        <div className="cursor-pointer">
          <p>Timelines</p>
        </div>
        <div>|</div>
        <div className="cursor-pointer">
          <p>My Account</p>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
