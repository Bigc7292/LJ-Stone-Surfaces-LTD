interface SectionHeadingProps {
  subtitle: string;
  title: string;
  align?: "left" | "center" | "right";
  light?: boolean;
}

export function SectionHeading({ subtitle, title, align = "center", light = false }: SectionHeadingProps) {
  const alignmentClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <div className={`flex flex-col mb-12 md:mb-20 ${alignmentClasses[align]}`}>
      <span className="text-primary text-xs md:text-sm tracking-[0.3em] uppercase font-bold mb-4">
        {subtitle}
      </span>
      <h2 className={`font-serif text-3xl md:text-5xl leading-tight ${light ? 'text-white' : 'text-foreground'}`}>
        {title}
      </h2>
      <div className="w-24 h-0.5 bg-primary/30 mt-6" />
    </div>
  );
}
