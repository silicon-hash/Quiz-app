import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AddTopicForm from "./AddTopicForm";
import { getTopics } from "@/src/lib/actions";
import Link from "next/link";
import { Button } from "../ui/button";
export const dynamic = "force-dynamic";
export default async function TopicList() {
  const topics = await getTopics();
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Topic List</h1>
        <AddTopicForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {topics.data.map((topic: any) => (
          <Card key={topic.id}>
            <CardHeader>
              <CardTitle>{topic.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Questions: {topic.question.length}
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/topics/${topic.id}`} passHref>
                <Button variant="outline">View Questions</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
