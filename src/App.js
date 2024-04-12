import React from "react";
import RoutesManager from "./Routes/RoutesManager";
import "@aws-amplify/ui-react/styles.css";
import { CustomHeader } from "./Components/CustomHeader/CustomHeader";
import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const App = () => {
  const myTheme = {
    name: "my-theme",
    tokens: {
      colors: {
        background: {
          primary: { value: "#2c2c2c" },
        },
        font: {
          primary: { value: "#fff" }, // General font color
        },
      },
      components: {
        input: {
          color: { value: "{colors.font.primary}" }, // Use font primary color for input text
        },
        tabs: {
          item: {
            _selected: {
              backgroundColor: { value: "#f7a44a" },
              color: { value: "#000" },
            },
            _hover: {
              backgroundColor: { value: "#f7a44a" },
              color: { value: "#000" },
            },
          },
        },
        button: {
          primary: {
            backgroundColor: { value: "#f7a44a" },
            borderColor: { value: "#f7a44a" },
            color: { value: "#000" },
          },
        },
        // Additional customization can go here
      },
    },
  };

  const components = {
    Header: CustomHeader, // Use your custom header component
  };
  return (
    <div className="bg-black h-screen pt-10">
      <ThemeProvider theme={myTheme}>
        {/* Apply the ThemeProvider here */}
        <Authenticator components={components}>
          {({ user }) => (user ? <RoutesManager /> : null)}
        </Authenticator>
      </ThemeProvider>
    </div>
  );
};

export default App;
