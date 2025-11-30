import { redirect } from "next/navigation";

export default function Home() {
  // Langsung arahkan ke folder /login
  redirect("/login");
}