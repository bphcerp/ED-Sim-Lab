import { FunctionComponent, useEffect, useState } from "react";
import SignInUpPane from "../components/SignInUpPane";
import { Navigate } from "react-router";

const LoginPage: FunctionComponent = () => {

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/check-auth`, {
            credentials: 'include',
            headers: {
              'From-Page': 'login',
          },
          });
  
          if (res.status === 200) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
          setIsAuthenticated(false);
        }
      };
  
      checkAuth();
    }, []);

  if (isAuthenticated){
    return <Navigate to="/dashboard" />
  }

  return (
    <div className="loginPage flex w-screen h-screen">
      <div className="flex justify-center items-center w-[40%] h-full bg-gray-200">
        <SignInUpPane />
      </div>
      <div className="flex justify-center items-center w-[60%] h-full">
        <img className="h-full" src="/banner.jpg" />
      </div>
    </div>
  );
}

export default LoginPage;