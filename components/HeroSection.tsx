import { Button } from "./ui/button";
import { useTheme } from "./ui/use-theme";

export function HeroSection() {
  const { isDark } = useTheme();

  return (
    <section 
      className="relative py-20 transition-colors duration-300"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, rgb(31 41 55) 0%, rgb(17 24 39) 50%, rgb(0 0 0) 100%)'
          : 'var(--universe-bg)'
      }}
    >
      <div 
        className="absolute inset-0 transition-colors duration-300"
        style={{
          background: isDark
            ? 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(34, 211, 238, 0.1), rgba(99, 102, 241, 0.1))'
            : 'linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(147, 197, 253, 0.05), rgba(99, 102, 241, 0.05))'
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl text-foreground mb-6 transition-colors duration-300">
            Il Futuro del{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Portfolio Management
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto transition-colors duration-300">
            Gestisci e riequilibra automaticamente il tuo portafoglio di criptovalute 
            con algoritmi intelligenti e strategie di investimento personalizzate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:from-emerald-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-8 py-3 transition-colors duration-300"
            >
              Inizia Ora
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className={`px-8 py-3 transition-colors duration-300 ${
                isDark
                  ? "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              Scopri di Più
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}