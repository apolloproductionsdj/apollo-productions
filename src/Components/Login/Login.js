import React, { useState } from "react";
// Import signIn function directly
import { signIn } from "@aws-amplify/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  let handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Use the signIn function directly
      let user = await signIn(email, password);
      console.log("user signed in", user);
      // Redirect or update the state based on the response
    } catch (error) {
      console.error("Error signing in", error);
      // Handle errors such as incorrect username or password
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Enter your password"
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
