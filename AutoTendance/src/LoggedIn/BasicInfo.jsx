import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function BasicInfo(props) {
  const year = props.year;
  const userId = props.userId;
  const name = props.name;
  const branch = props.branch;

  return (
    <div className="flex flex-row gap-4 p-2 m-2">
      <Avatar>
        <AvatarImage
          src={`http://localhost:5000//images/${year}/${userId}/${userId}.jpeg`}
        />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <div>
        <div>
          <Badge className="m-1">KJ Somaiya College of Engineering</Badge>{" "}
        </div>
        <div>
          <Badge className="m-1 w-20">Name</Badge>{" "}
          <Badge variant="secondary" className="min-w-32">
            {name}
          </Badge>
        </div>
        {userId && (
          <div>
            <Badge className="m-1 w-20">Roll No</Badge>{" "}
            <Badge variant="secondary" className="min-w-32">
              {userId}
            </Badge>
          </div>
        )}
        <Badge className="m-1 w-20">Batch</Badge>{" "}
        <Badge variant="secondary" className="min-w-32">
          {branch}
        </Badge>
        <div>
          <Badge className="m-1 w-20">Year</Badge>{" "}
          <Badge variant="secondary" className="min-w-32">
            {year}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default BasicInfo;
