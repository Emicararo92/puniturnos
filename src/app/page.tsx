import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomePage from "../components/Home/Home";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return <HomePage />;
}
