import { Garden } from "@/party/garden";

export default function Display(props: {
  garden: Garden;
  gardenSize: number;
  starterIsEmpty: boolean;
  handlePlantEmoji: (i: number) => void;
}) {
  const { garden, gardenSize, starterIsEmpty, handlePlantEmoji } = props;

  return (
    <div className="grid grid-cols-10 grid-rows-10 bg-lime-200">
      {[...Array(gardenSize)].map((_, i) => {
        const cell = garden[i] ?? null;
        return (
          <button
            key={i}
            className="bg-lime-200 w-10 h-10 flex justify-center items-center hover:bg-lime-300 hover:rounded-full disabled:rounded-none disabled:bg-lime-200 disabled:cursor-not-allowed text-4xl overflow-clip"
            disabled={starterIsEmpty || cell !== null}
            onClick={() => handlePlantEmoji(i)}
          >
            {cell ? cell.emoji : ""}
          </button>
        );
      })}
    </div>
  );
}
