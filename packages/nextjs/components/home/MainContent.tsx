import { Button } from "~~/components/shared/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/shared/card";
import { useTheme } from "~~/components/shared/use-theme";

interface MainContentProps {
  activeTab: 'home' | 'about' | 'rebalance';
}

export function MainContent({ activeTab }: MainContentProps) {
  const { isDark } = useTheme();

  const getBackgroundStyle = () => ({
    background: isDark 
      ? 'linear-gradient(135deg, rgb(31 41 55) 0%, rgb(17 24 39) 50%, rgb(0 0 0) 100%)'
      : 'var(--universe-bg)'
  });

  const getOverlayStyle = () => ({
    background: isDark
      ? 'linear-gradient(to right, rgba(20, 184, 166, 0.1), rgba(34, 211, 238, 0.1), rgba(99, 102, 241, 0.1))'
      : 'linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(147, 197, 253, 0.05), rgba(99, 102, 241, 0.05))'
  });

  const getCardStyle = () => ({
    backgroundColor: 'var(--card-bg)',
    borderColor: isDark ? 'rgb(55 65 81)' : 'var(--border-light)'
  });

  if (activeTab === 'home') {
    return (
      <div className="flex-1 flex items-center justify-center transition-colors duration-300" style={getBackgroundStyle()}>
        <div className="absolute inset-0 transition-colors duration-300" style={getOverlayStyle()} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl text-foreground mb-6 transition-colors duration-300">
            Il Futuro del{" "}
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Portfolio Management
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-4xl mx-auto transition-colors duration-300">
            1balancer è una piattaforma finanziaria innovativa che ti permette di gestire 
            e riequilibrare il tuo portafoglio di criptovalute in modo automatico e intelligente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-8 py-3 transition-colors duration-300"
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
    );
  }

  if (activeTab === 'about') {
    return (
      <div className="flex-1 flex items-center justify-center transition-colors duration-300" style={getBackgroundStyle()}>
        <div className="absolute inset-0 transition-colors duration-300" style={getOverlayStyle()} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl text-foreground mb-6 transition-colors duration-300">
            Chi Siamo
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-4xl mx-auto transition-colors duration-300">
            1balancer è stata fondata da un team di esperti finanziari e sviluppatori blockchain 
            con l'obiettivo di rendere la gestione dei portfolio crypto accessibile a tutti.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            <Card className="backdrop-blur-sm border transition-all duration-300" style={getCardStyle()}>
              <CardHeader>
                <CardTitle className="text-foreground transition-colors duration-300">La Nostra Missione</CardTitle>
                <CardDescription className="text-muted-foreground transition-colors duration-300">
                  Democratizzare l'accesso a strategie di investimento avanzate nel mondo crypto.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="backdrop-blur-sm border transition-all duration-300" style={getCardStyle()}>
              <CardHeader>
                <CardTitle className="text-foreground transition-colors duration-300">Tecnologia</CardTitle>
                <CardDescription className="text-muted-foreground transition-colors duration-300">
                  Algoritmi di machine learning e analisi tecnica per decisioni di investimento ottimali.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="backdrop-blur-sm border transition-all duration-300" style={getCardStyle()}>
              <CardHeader>
                <CardTitle className="text-foreground transition-colors duration-300">Sicurezza</CardTitle>
                <CardDescription className="text-muted-foreground transition-colors duration-300">
                  I tuoi fondi rimangono sempre sotto il tuo controllo grazie alla tecnologia DeFi.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-8 transition-colors duration-300" style={getBackgroundStyle()}>
      <div className="absolute inset-0 transition-colors duration-300" style={getOverlayStyle()} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl text-foreground mb-4 transition-colors duration-300">Smart Rebalancing</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto transition-colors duration-300">
            Il nostro algoritmo di riequilibrio automatico mantiene il tuo portafoglio 
            allineato alla tua strategia di investimento target.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center backdrop-blur-sm border transition-all duration-300" style={getCardStyle()}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-black text-xl">⚡</span>
              </div>
              <CardTitle className="text-lg text-foreground transition-colors duration-300">Automatico</CardTitle>
              <CardDescription className="text-muted-foreground text-sm transition-colors duration-300">
                Riequilibrio automatico basato su soglie predefinite
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center backdrop-blur-sm border transition-all duration-300" style={getCardStyle()}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-black text-xl">🧠</span>
              </div>
              <CardTitle className="text-lg text-foreground transition-colors duration-300">Intelligente</CardTitle>
              <CardDescription className="text-muted-foreground text-sm transition-colors duration-300">
                Analisi di mercato in tempo reale per decisioni ottimali
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center backdrop-blur-sm border transition-all duration-300" style={getCardStyle()}>
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-black text-xl">🔒</span>
              </div>
              <CardTitle className="text-lg text-foreground transition-colors duration-300">Sicuro</CardTitle>
              <CardDescription className="text-muted-foreground text-sm transition-colors duration-300">
                Protocolli di sicurezza avanzati per i tuoi fondi
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500 hover:from-teal-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-8 py-3 transition-colors duration-300"
          >
            Inizia il Rebalancing
          </Button>
        </div>
      </div>
    </div>
  );
}