import { lazy, Suspense } from "react";

//React Router
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
// import Spinner from "../Components/LoadingSpinners/LoadingSpinnerPacMan";

// Lazy Loading
const NavBar = lazy(() => import("../Components/NavBar/NavBar"));
const HomePage = lazy(() => import("../Pages/HomePage/HomePage"));
const UploaderPage = lazy(() => import("../Pages/UploaderPage/UploaderPage"));
// const LoginPage = lazy(() => import("../Pages/AuthPages/LoginPage/LoginPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <NavBar />
        <HomePage />
      </>
    ),
  },
  {
    path: "/uploader",
    element: (
      <>
        <NavBar />
        <UploaderPage />
      </>
    ),
    // errorElement: <ErrorHandlingPage />,
  },
]);

// Component that sets up the router
const RoutesManager = () => {
  return (
    // <Suspense fallback={<Spinner />}>
    <Suspense>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default RoutesManager;
