import { redirect } from "next/navigation";

export default async function BancoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams();
  params.set("tab", "bank");

  for (const [key, value] of Object.entries(resolvedParams)) {
    if (value && typeof value === "string") {
      params.set(key, value);
    }
  }

  redirect(`/questions?${params.toString()}`);
}
