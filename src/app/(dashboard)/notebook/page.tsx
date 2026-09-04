import { redirect } from "next/navigation";

export default function NotebookPage() {
  redirect("/questions?tab=notebook");
}

