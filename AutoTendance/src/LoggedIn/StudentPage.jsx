"use client";

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function StudentPage() {
  const location = useLocation();
  const rollNo = location.state?.rollNo;
  const [studentInfo, setStudentInfo] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [subjectName, setSubjectName] = useState("");
  const { toast } = useToast();

  const markAbsence = async () => {
    // Validate input fields
    if (!rollNo || !selectedDate || !subjectName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields before marking absence.",
      });
      return; // Exit the function if validation fails
    }

    try {
      const response = await fetch(`http://localhost:5000/mark-absence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rollNo,
          date: addDays(selectedDate, 1).toISOString(),
          lecture: subjectName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error messages
        if (data.error === "Already marked absent for this date.") {
          toast({
            variant: "destructive",
            title: "Already Marked Absent",
            description: "This student is already marked absent for this date.",
          });
          return; // Exit if already marked absent
        }
        throw new Error(data.error || "Failed to mark absence");
      }

      await fetchAttendanceData();
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Absence marked successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to mark absence. Please try again.",
      });
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const attendanceResponse = await fetch(
        `http://localhost:5000/getAttendancePercentage?rollno=${rollNo}`
      );

      if (!attendanceResponse.ok) {
        throw new Error("Failed to fetch attendance data");
      }

      const updatedAttendanceData = await attendanceResponse.json();
      setAttendanceData(updatedAttendanceData);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch attendance data. Please try again.",
      });
    }
  };

  const handleAttendanceUpdate = async (e) => {
    e.preventDefault();
    try {
      const adjustedDate = addDays(selectedDate, 1);

      const response = await fetch(`http://localhost:5000/add-attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rollNo,
          date: adjustedDate.toISOString(),
          lecture: subjectName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchAttendanceData();
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Attendance marked successfully.",
        });
      } else {
        if (data.error === "Already marked present for this date.") {
          toast({
            variant: "destructive",
            title: "Already Marked",
            description:
              "This student is already marked present for this date.",
          });
        } else {
          throw new Error(data.error || "Failed to update attendance");
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message || "Failed to update attendance. Please try again.",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!rollNo) return;

      try {
        const [infoResponse, attendanceResponse] = await Promise.all([
          fetch(`http://localhost:5000/getBasicInfo?rollno=${rollNo}`),
          fetch(
            `http://localhost:5000/getAttendancePercentage?rollno=${rollNo}`
          ),
        ]);

        if (!infoResponse.ok || !attendanceResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [infoData, attendanceData] = await Promise.all([
          infoResponse.json(),
          attendanceResponse.json(),
        ]);

        setStudentInfo(infoData);
        setAttendanceData(attendanceData);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load student data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rollNo, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-52">
        <Card className="p-6 w-full max-w-4xl">
          <Skeleton className="w-[250px] h-[20px] mb-4" />
          <Skeleton className="w-[300px] h-[20px] mb-4" />
          <Skeleton className="w-[200px] h-[20px] mb-4" />
          <Skeleton className="w-[150px] h-[20px]" />
        </Card>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="flex justify-center items-center mt-52">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No student information found. Please check the roll number and try
            again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center mt-8 mb-8">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Personal Details</h2>
                <p>
                  <strong>Roll No:</strong> {rollNo}
                </p>
                <p>
                  <strong>Name:</strong> {studentInfo.name}
                </p>
                <p>
                  <strong>Branch:</strong> {studentInfo.branch}
                </p>
                <p>
                  <strong>Year:</strong> {studentInfo.year}
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Attendance Stats</h2>
                {attendanceData ? (
                  <>
                    <p>
                      <strong>Total Classes:</strong>{" "}
                      {attendanceData.total_classes}
                    </p>
                    <p>
                      <strong>Present Count:</strong>{" "}
                      {attendanceData.present_count}
                    </p>
                    <p>
                      <strong>Attendance Percentage:</strong>{" "}
                      {attendanceData.attendance_percentage.toFixed(2)}%
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="mt-4">
                          <Edit className="mr-2 w-4 h-4" /> Edit Attendance
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Attendance</DialogTitle>
                          <DialogDescription>
                            Select the date and subject for which this student
                            attended.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAttendanceUpdate}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center">
                              <Label htmlFor="date" className="p-4 text-right">
                                Date
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                      "w-[240px] justify-start text-left font-normal",
                                      !selectedDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 w-4 h-4" />
                                    {selectedDate ? (
                                      format(selectedDate, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="p-0 w-auto"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="grid grid-cols-4 items-center">
                              <Label
                                htmlFor="subject"
                                className="p-4 text-right"
                              >
                                Subject
                              </Label>
                              <Input
                                id="subject"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Add Attendance</Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={markAbsence}
                            >
                              Mark Absence
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <p>No attendance data found for this student.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
}
