"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Lock, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function LoginBox() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginFailed, setLoginFailed] = useState(false);
  const navigate = useNavigate();

  const loginClickHandler = async () => {
    const userId = await sendCredentials();
    if (userId || userId == 0) {
      navigate("LoggedIn", { state: { userId } });
    } else {
      setLoginFailed(true);
    }
  };

  const sendCredentials = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/login?username=${username}&password=${password}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const result = await response.json();

      if (result.message === "Login successful") {
        return result.user_id;
      } else {
        return null;
      }
    } catch (error) {
      console.log("Error during fetch:", error);
      return null;
    }
  };

  return (
    <div className="flex justify-center items-center mt-52 bg-gray-100 dark:bg-[rgb(15,15,15)]">
      <Card className="w-full max-w-md border border-black/20 dark:border-white/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {loginFailed && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Invalid Username or Password</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={loginClickHandler}>
            Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default LoginBox;
