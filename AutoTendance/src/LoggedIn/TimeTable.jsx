"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function TimeTable(props) {
  const [timetable, setTimetable] = useState(null);
  const year = props.year;
  const branch = props.branch;

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await fetch(`http://localhost:5000/getTimeTable`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setTimetable(data);
      } catch (error) {
        console.error("Error fetching timetable:", error);
      }
    };
    fetchTimetable();
  }, []);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const timeSlots = [11, 12, 13, 14, 15];

  const getSubjectColor = (subject) => {
    const colors = [
      "text-red-600",
      "text-blue-600",
      "text-green-600",
      "text-yellow-600",
      "text-purple-600",
      "text-pink-600",
      "text-indigo-600",
    ];
    const hash = subject
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Timetable for {props.year} : {branch}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timetable ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                {daysOfWeek.map((day) => (
                  <TableHead key={day} className="text-center">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map((time) => (
                <TableRow key={time}>
                  <TableCell className="font-medium">{time}:00</TableCell>
                  {daysOfWeek.map((day) => (
                    <TableCell
                      key={`${day}-${time}`}
                      className="p-0 text-center"
                    >
                      <div className="flex justify-center items-center mx-auto w-28 h-16">
                        {timetable[day][time] ? (
                          <span
                            className={`text-sm font-medium transition-opacity ${getSubjectColor(
                              timetable[day][time]
                            )} hover:opacity-80`}
                          >
                            {timetable[day][time]}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No subject
                          </span>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="space-y-2">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="w-full h-12" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TimeTable;
