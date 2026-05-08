import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <section className="flex flex-1 items-center justify-center px-6 py-16">
      <SignUp />
    </section>
  );
}
