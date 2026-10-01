export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out">
      {children}
    </div>
  );
}
