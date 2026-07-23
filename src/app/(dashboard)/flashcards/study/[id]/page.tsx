import { prisma } from "@/lib/prisma";
import StudyFlashcard from "@/components/flashcards/StudyFlashcard";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deck = await prisma.deck.findUnique({
    where: { id: id },
    include: { flashcards: true },
  });

  if (!deck) return <div className="p-8 text-white">Deck não encontrado.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto ">
      <StudyFlashcard cards={deck.flashcards} />
    </div>
  );
}
