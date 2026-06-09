import { redirect } from "next/navigation";

export default async function LearnLessonRedirect({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  redirect(`/academy/lesson/${lessonId}`);
}
