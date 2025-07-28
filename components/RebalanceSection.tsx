import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useTheme } from "./ui/use-theme";

export function RebalanceSection() {
  const { isDark } = useTheme();

  return (
    <section 
      id="rebalance" 
      className="py-20 transition-colors duration-300 bg-background"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl text-foreground mb-8 transition-colors duration-300">
            Smart Rebalancing
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto transition-colors duration-300">
            Il nostro algoritmo di riequilibrio automatico mantiene il tuo portafoglio 
            allineato alla tua strategia di investimento target.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card 
            className="text-center border transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: isDark ? '#374151' : 'var(--border-light)'
            }}
          >
            <CardHeader>
              <CardTitle className="text-xl text-foreground transition-colors duration-300">
                Automatico
              </CardTitle>
              <CardDescription className="text-muted-foreground transition-colors duration-300">
                Riequilibrio automatico basato su soglie predefinite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-black text-2xl">⚡</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="text-center border transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: isDark ? '#374151' : 'var(--border-light)'
            }}
          >
            <CardHeader>
              <CardTitle className="text-xl text-foreground transition-colors duration-300">
                Intelligente
              </CardTitle>
              <CardDescription className="text-muted-foreground transition-colors duration-300">
                Analisi di mercato in tempo reale per decisioni ottimali
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-black text-2xl">🧠</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="text-center border transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              borderColor: isDark ? '#374151' : 'var(--border-light)'
            }}
          >
            <CardHeader>
              <CardTitle className="text-xl text-foreground transition-colors duration-300">
                Sicuro
              </CardTitle>
              <CardDescription className="text-muted-foreground transition-colors duration-300">
                Protocolli di sicurezza avanzati per i tuoi fondi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-black text-2xl">🔒</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 hover:from-emerald-500 hover:via-cyan-500 hover:to-indigo-600 text-black px-8 py-3 transition-colors duration-300"
          >
            Inizia il Rebalancing
          </Button>
        </div>
      </div>
    </section>
  );
}