"use client";

import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, BarChart2, Calendar } from "lucide-react";
import BasicInfo from "./BasicInfo";
import Statistics from "./Statistics";
import TimeTable from "./TimeTable";
import AdminPage from "./AdminPage"; // Import the new AdminPage component

function LoggedIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState();
  const [name, setName] = useState(null);
  const [branch, setBranch] = useState(null);
  const [year, setYear] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { userId } = location.state || {};
    setUserId(userId);

    // Redirect to admin page if userId is 0
    if (userId === 0) {
      navigate("/admin"); // Change this path according to your routing setup
    }

    if (userId) {
      const fetchUserInfo = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/getBasicInfo?rollno=${userId}`
          );
          if (!response.ok) throw new Error("Network response was not ok");
          const result = await response.json();
          setName(result.name);
          setYear(result.year);
          setBranch(result.branch);
          setIsLoading(false);
        } catch (error) {
          console.error("Error during fetch:", error);
          setIsLoading(false);
        }
      };

      fetchUserInfo();
    }
  }, [location.state, navigate]);

  // Don't render anything if userId is 0
  if (userId === 0) return null;

  return (
    <Card className="mx-auto mt-10 w-full max-w-4xl border shadow-lg border-black/20 dark:border-white/10 shadow-black/40">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {isLoading ? (
            <Skeleton className="mx-auto w-64 h-8" />
          ) : (
            `Welcome, ${name || "Student"}!`
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8 w-full">
            <TabsTrigger
              value="account"
              className="flex justify-center items-center"
            >
              <UserCircle className="mr-2 w-4 h-4" />
              Details
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="flex justify-center items-center"
            >
              <BarChart2 className="mr-2 w-4 h-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger
              value="timetable"
              className="flex justify-center items-center"
            >
              <Calendar className="mr-2 w-4 h-4" />
              Time Table
            </TabsTrigger>
          </TabsList>
          <div className="p-4 bg-white rounded-lg shadow-md dark:bg-[rgb(10,10,10)]">
            <TabsContent value="account">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="w-full h-12" />
                  <Skeleton className="w-full h-12" />
                  <Skeleton className="w-full h-12" />
                </div>
              ) : (
                <BasicInfo
                  name={name}
                  year={year}
                  branch={branch}
                  userId={userId}
                />
              )}
            </TabsContent>
            <TabsContent value="statistics">
              <Statistics rollno={userId} />
            </TabsContent>
            <TabsContent value="timetable">
              <TimeTable year={year} branch={branch} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default LoggedIn;
