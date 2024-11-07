"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ToastAction } from "@/components/ui/toast";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: "",
    year: "all",
    branch: "all",
    rollNo: "",
    below75: false,
  });

  const [newStudent, setNewStudent] = useState({
    rollNo: "",
    name: "",
    branch: "",
    year: "",
    username: "",
    password: "",
    picture: null,
  });

  const [automaticAttendance, setAutomaticAttendance] = useState({
    date: new Date(),
    lecture: "",
    branch: "",
    year: "",
    picture: null,
  });

  const nameInputRef = useRef(null);
  const rollNoInputRef = useRef(null);

  const uniqueYears = useMemo(
    () => [...new Set(students.map((student) => student.year))].sort(),
    [students]
  );
  const uniqueBranches = useMemo(
    () => [...new Set(students.map((student) => student.branch))].sort(),
    [students]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsResponse, attendanceResponse] = await Promise.all([
          fetch("http://localhost:5000/admin/students"),
          fetch("http://localhost:5000/admin/student-attendance"),
        ]);

        if (!studentsResponse.ok || !attendanceResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const studentsData = await studentsResponse.json();
        const attendanceData = await attendanceResponse.json();

        setStudents(studentsData.students);
        setAttendance(attendanceData.attendance);

        toast({
          title: "Data loaded successfully",
          description: `Loaded ${studentsData.students.length} student records`,
          action: <ToastAction altText="Refresh data">Refresh</ToastAction>,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Please check your connection and try again.",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleStudentClick = useCallback(
    (rollNo) => {
      navigate("/student", { state: { rollNo } });
    },
    [navigate]
  );

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      name: "",
      year: "all",
      branch: "all",
      rollNo: "",
      below75: false,
    });
    nameInputRef.current?.focus();
    toast({
      title: "Filters reset",
      description: "All filters have been cleared",
      action: <ToastAction altText="Undo">Undo</ToastAction>,
    });
  }, [toast]);

  const handleNewStudentChange = (e) => {
    const { name, value, files } = e.target;
    setNewStudent((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmitNewStudent = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.entries(newStudent).forEach(([key, value]) => {
      if (key !== "picture" || value !== null) {
        formData.append(key, value);
      }
    });

    try {
      const response = await fetch("http://localhost:5000/AddStudent", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to add student");
      }

      const result = await response.json();
      console.log("Student added:", result);

      setNewStudent({
        rollNo: "",
        name: "",
        branch: "",
        year: "",
        username: "",
        password: "",
        picture: null,
      });

      toast({
        title: "Student added",
        description: "New student has been successfully added.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Username or Roll Number already exists",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  const handleAutomaticAttendanceChange = (name, value) => {
    setAutomaticAttendance((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAutomaticAttendance = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("date", automaticAttendance.date.toISOString());
    formData.append("lecture", automaticAttendance.lecture);
    formData.append("branch", automaticAttendance.branch);
    formData.append("year", automaticAttendance.year);
    if (automaticAttendance.picture) {
      formData.append("picture", automaticAttendance.picture);
    }

    try {
      const response = await fetch(
        "http://localhost:5000/automatic-attendance",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit automatic attendance");
      }

      const result = await response.json();
      console.log("Automatic attendance submitted:", result);

      setAutomaticAttendance({
        date: new Date(),
        lecture: "",
        branch: "",
        year: "",
        picture: null,
      });

      toast({
        title: "Attendance submitted",
        description: "Automatic attendance has been successfully recorded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit automatic attendance. Please try again.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const nameMatch = student.name
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const yearMatch =
        filters.year === "all" || student.year.toString() === filters.year;
      const branchMatch =
        filters.branch === "all" || student.branch === filters.branch;
      return nameMatch && yearMatch && branchMatch;
    });
  }, [students, filters]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const rollNoMatch =
        filters.rollNo === "" ||
        record.rollNo.toString().includes(filters.rollNo);
      const attendanceMatch =
        !filters.below75 || record.attendancePercentage < 75;
      return rollNoMatch && attendanceMatch;
    });
  }, [attendance, filters]);

  const FilterControls = () => {
    const handleNameChange = useCallback((e) => {
      handleFilterChange("name", e.target.value);
    }, []);

    const handleSelectChange = useCallback((key, value) => {
      handleFilterChange(key, value);
      nameInputRef.current?.focus();
    }, []);

    return (
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Input
              ref={nameInputRef}
              placeholder="Search by name..."
              value={filters.name}
              onChange={handleNameChange}
              className="w-full border border-black/20 dark:border-white/10"
            />
          </div>
          <div>
            <Select
              value={filters.year}
              onValueChange={(value) => handleSelectChange("year", value)}
            >
              <SelectTrigger className="border border-black/20 dark:border-white/10">
                <SelectValue placeholder="Filter by Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    Year {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select
              value={filters.branch}
              onValueChange={(value) => handleSelectChange("branch", value)}
            >
              <SelectTrigger className="border border-black/20 dark:border-white/10">
                <SelectValue placeholder="Filter by Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {uniqueBranches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button onClick={resetFilters} className="w-full">
              Reset Filters
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>
    );
  };

  const AttendanceFilterControls = () => {
    const handleRollNoChange = useCallback((e) => {
      handleFilterChange("rollNo", e.target.value);
    }, []);

    return (
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Input
              ref={rollNoInputRef}
              placeholder="Search by Roll No..."
              value={filters.rollNo}
              onChange={handleRollNoChange}
              className="w-full border border-black/20 dark:border-white/20"
            />
          </div>
          <div className="flex items-center">
            <input
              id="below75"
              type="checkbox"
              checked={filters.below75}
              onChange={(e) => {
                handleFilterChange("below75", e.target.checked);
                rollNoInputRef.current?.focus();
              }}
              className="mr-2 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label
              htmlFor="below75"
              className="text-sm font-medium text-gray-700"
            >
              Below 75% Attendance
            </Label>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredAttendance.length} of {attendance.length} attendance
          records
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full border-b-2 animate-spin border-primary"></div>
            </div>
            <p className="mt-4 text-lg font-semibold text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto bg-gray-200 dark:bg-[rgb(15,15,15)]">
      <Card className="w-full border shadow-md border-black/20 shadow-black/20 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="students">Student Information</TabsTrigger>
              <TabsTrigger value="attendance">Attendance Overview</TabsTrigger>
              <TabsTrigger value="addstudent">Add Student</TabsTrigger>
              <TabsTrigger value="autotendance">
                Automatic Attendance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="autotendance">
              <Card>
                <CardHeader>
                  <CardTitle>Automatic Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleAutomaticAttendance}
                    className="space-y-4"
                  >
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal border border-black/20 dark:border-white/10",
                              !automaticAttendance.date &&
                                "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 w-4 h-4" />
                            {automaticAttendance.date ? (
                              format(automaticAttendance.date, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-auto">
                          <Calendar
                            mode="single"
                            selected={automaticAttendance.date}
                            onSelect={(date) =>
                              handleAutomaticAttendanceChange("date", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="lecture">Lecture</Label>
                      <Input
                        id="lecture"
                        name="lecture"
                        value={automaticAttendance.lecture}
                        onChange={(e) =>
                          handleAutomaticAttendanceChange(
                            "lecture",
                            e.target.value
                          )
                        }
                        required
                        className="mt-1 border border-black/20 dark:border-white/10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="branch">Branch</Label>
                      <Select
                        name="branch"
                        value={automaticAttendance.branch}
                        onValueChange={(value) =>
                          handleAutomaticAttendanceChange("branch", value)
                        }
                      >
                        <SelectTrigger className="mt-1 border border-black/20 dark:border-white/10">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETRX">ETRX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Select
                        name="year"
                        value={automaticAttendance.year}
                        onValueChange={(value) =>
                          handleAutomaticAttendanceChange("year", value)
                        }
                      >
                        <SelectTrigger className="mt-1 border border-black/20 dark:border-white/10">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FY">FY</SelectItem>
                          <SelectItem value="SY">SY</SelectItem>
                          <SelectItem value="TY">TY</SelectItem>
                          <SelectItem value="LY">LY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="picture">Picture</Label>
                      <Input
                        id="picture"
                        name="picture"
                        type="file"
                        onChange={(e) =>
                          handleAutomaticAttendanceChange(
                            "picture",
                            e.target.files[0]
                          )
                        }
                        accept="image/*"
                        className="mt-1 border border-black/20 dark:border-white/10"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Submit Automatic Attendance
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addstudent">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Student</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitNewStudent} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="rollNo">Roll Number</Label>
                        <Input
                          id="rollNo"
                          name="rollNo"
                          type="number"
                          value={newStudent.rollNo}
                          onChange={handleNewStudentChange}
                          required
                          className="mt-1 border border-black/20 dark:border-white/10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={newStudent.name}
                          onChange={handleNewStudentChange}
                          required
                          className="mt-1 border border-black/20 dark:border-white/10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="branch">Branch</Label>
                        <Select
                          name="branch"
                          value={newStudent.branch}
                          onValueChange={(value) =>
                            setNewStudent((prev) => ({
                              ...prev,
                              branch: value,
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1 border border-black/20 dark:border-white/10">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ETRX">ETRX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="year">Year</Label>
                        <Select
                          name="year"
                          value={newStudent.year}
                          onValueChange={(value) =>
                            setNewStudent((prev) => ({ ...prev, year: value }))
                          }
                        >
                          <SelectTrigger className="mt-1 border border-black/20 dark:border-white/10">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FY">FY</SelectItem>
                            <SelectItem value="SY">SY</SelectItem>
                            <SelectItem value="TY">TY</SelectItem>
                            <SelectItem value="LY">LY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={newStudent.username}
                          onChange={handleNewStudentChange}
                          required
                          className="mt-1 border border-black/20 dark:border-white/10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={newStudent.password}
                          onChange={handleNewStudentChange}
                          required
                          className="mt-1 border border-black/20 dark:border-white/10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="picture">Picture</Label>
                      <Input
                        id="picture"
                        name="picture"
                        type="file"
                        onChange={handleNewStudentChange}
                        accept="image/*"
                        className="mt-1 border border-black/20 dark:border-white/10"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Student
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilterControls />
                  <div className="rounded-md border border-black/20 dark:border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Roll No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Year</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              No students found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStudents.map((student) => (
                            <TableRow
                              key={student.rollNo}
                              onClick={() => handleStudentClick(student.rollNo)}
                              className="cursor-pointer hover:bg-muted/50"
                            >
                              <TableCell className="font-medium">
                                {student.rollNo}
                              </TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.branch}</TableCell>
                              <TableCell>{student.year}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceFilterControls />
                  <div className="rounded-md border border-black/20 dark:border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Roll No</TableHead>
                          <TableHead>Total Classes</TableHead>
                          <TableHead>Present Count</TableHead>
                          <TableHead>Attendance %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAttendance.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              No attendance records found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAttendance.map((record) => (
                            <TableRow
                              key={record.rollNo}
                              className={
                                record.attendancePercentage < 75
                                  ? "bg-red-200/90 dark:bg-red-900/30"
                                  : ""
                              }
                            >
                              <TableCell className="font-medium">
                                {record.rollNo}
                              </TableCell>
                              <TableCell>{record.totalClasses}</TableCell>
                              <TableCell>{record.presentCount}</TableCell>
                              <TableCell
                                className={
                                  record.attendancePercentage < 75
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }
                              >
                                {`${record.attendancePercentage.toFixed(2)}%`}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
