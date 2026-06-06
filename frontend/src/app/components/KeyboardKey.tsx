interface KeyboardKeyProps {
  symbol: string;
}

export function KeyboardKey({ symbol }: KeyboardKeyProps) {
  return (
    <button
      className="
        relative
        w-16 h-16
        bg-[#a8adb5]
        rounded-[10px]
        text-white
        font-medium
        text-xl
        transition-all
        duration-150
        active:translate-y-0.5
        active:shadow-sm
      "
      style={{
        boxShadow: `
          inset 2px 2px 4px rgba(255, 255, 255, 0.3),
          inset -2px -2px 4px rgba(0, 0, 0, 0.15),
          4px 4px 8px rgba(0, 0, 0, 0.2),
          -2px -2px 6px rgba(255, 255, 255, 0.4)
        `,
      }}
    >
      {symbol}
    </button>
  );
}
