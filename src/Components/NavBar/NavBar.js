import React from "react";
import apdjLogo from "../../Assets/images/APDJ.png";
import apdjLogoGrey from "../../Assets/images/APDJGrey.png";
import tempDJs2 from "../../Assets/images/temp-djs2.jpg";

import apdjLogoGray from "../../Assets/images/APDJGray.png";
import apdjLogoGrey1 from "../../Assets/images/APDJGray1.png";

import { Link } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
// Redux
import { useDispatch, useSelector } from "react-redux";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { setTheme } from "../../redux/slices/AppSettings";

const NavBar = () => {
  const { user, signOut } = useAuthenticator();
  console.log("user", user);
  console.log(user.signInDetails.loginId);

  const { theme } = useSelector((state) => state.appSettings);
  const dispatch = useDispatch();

  const changeTheme = () => {
    dispatch(setTheme());
  };
  const ThemeIcon = theme === "light" ? DarkModeIcon : LightModeIcon;
  const navBarClass = theme === "light" ? "bg-white" : "bg-[#111111]";
  const textColorClass = theme === "light" ? "text-[#727176]" : "text-white"; // Adjust text color based on theme

  // Function to transform the username
  const formatUsername = (username) => {
    if (username.toLowerCase() === "dje") {
      return "DJ E"; // Only add a space after the "J" and capitalize everything
    }
    return username; // Return the original username if it's not "dje"
  };

  const logoSrc = theme === "light" ? apdjLogo : apdjLogoGrey;

  return (
    <div
      className={`${navBarClass} fixed w-full flex justify-between items-center px-8 font-sans top-0 z-20`}
    >
      <div className="flex items-center cursor-pointer">
        <img
          src={logoSrc}
          className="object-contain h-32 w-48"
          alt="Company Logo"
        />
      </div>
      <div className={`flex items-center space-x-3 ${textColorClass}`}>
        <Link
          to={"/"}
          className="hover:text-[#f7a44a] cursor-pointer transition duration-300"
        >
          Home
        </Link>

        {user.signInDetails.loginId === "dje" && (
          <>
            <div>|</div>
            <Link
              to={"/uploader"}
              className="hover:text-[#f7a44a] cursor-pointer transition duration-300"
            >
              Uploader
            </Link>
          </>
        )}
        <div>|</div>
        <div className="cursor-pointer">
          <ThemeIcon
            className="cursor-pointer hover:text-[#f7a44a] transition duration-300 mr-2"
            onClick={changeTheme}
          />
        </div>
        <div>|</div>
        {user?.username && (
          <span>Welcome:: {formatUsername(user.username)}</span> // Apply the transformation here
        )}
        <div>|</div>
        <button
          className="cursor-pointer hover:text-[#f7a44a] transition duration-300"
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default NavBar;
