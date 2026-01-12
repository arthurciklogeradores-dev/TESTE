
import React, { useState, useEffect } from 'react';
import { Fraction, Operation, HistoryItem } from './types';
import { addFractions, subtractFractions, multiplyFractions, divideFractions, simplify, formatFraction } from './utils/math';
import FractionDisplay from './components/FractionDisplay';
import { solveWithAI } from './services/geminiService';
import { parseLocalFractions } from './services/localParserService';

const App: React.FC = () => {
  const [currentN, setCurrentN] = useState<string>('');
  const [currentD, setCurrentD] = useState<string>('');
  const [storedFraction, setStoredFraction] = useState<Fraction | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const clear = () => {
    setCurrentN('');
    setCurrentD('');
    setStoredFraction(null);
    setOperation(null);
    setAiResponse(null);
    if (window.navigator.vibrate) window.navigator.vibrate(10);
  };

  const handleNumber = (num: string, target: 'n' | 'd') => {
    if (target === 'n') setCurrentN(prev => prev + num);
    else setCurrentD(prev => prev + num);
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  };

  const setOp = (op: Operation) => {
    if (currentN) {
      const f = simplify({ n: Number(currentN) || 0, d: Number(currentD) || 1 });
      setStoredFraction(f);
      setOperation(op);
      setCurrentN('');
      setCurrentD('');
      if (window.navigator.vibrate) window.navigator.vibrate(15);
    }
  };

  const calculate = () => {
    if (!storedFraction || !operation || !currentN) return;

    const currentF = simplify({ n: Number(currentN) || 0, d: Number(currentD) || 1 });
    let result: Fraction;

    switch (operation) {
      case '+': result = addFractions(storedFraction, currentF); break;
      case '-': result = subtractFractions(storedFraction, currentF); break;
      case '*': result = multiplyFractions(storedFraction, currentF); break;
      case '/': result = divideFractions(storedFraction, currentF); break;
      default: return;
    }

    const item: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      expression: `${formatFraction(storedFraction)} ${operation} ${formatFraction(currentF)}`,
      result,
      decimal: result.n / result.d,
      timestamp: Date.now()
    };

    setHistory(prev => [item, ...prev].slice(0, 10));
    setStoredFraction(result);
    setCurrentN('');
    setCurrentD('');
    setOperation(null);
    if (window.navigator.vibrate) window.navigator.vibrate(25);
  };

  const handleAiSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);

    try {
      let result;
      if (isOnline) {
        result = await solveWithAI(aiInput);
      } else {
        result = parseLocalFractions(aiInput);
      }

      setAiResponse(result);
      const newHistory: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        expression: result.expression,
        result: { n: result.numerator, d: result.denominator },
        decimal: result.numerator / result.denominator,
        timestamp: Date.now()
      };
      setHistory(prev => [newHistory, ...prev].slice(0, 10));
    } catch (err) {
      alert(isOnline ? "Erro ao processar com IA." : "Não entendi essa expressão localmente. Tente '1/2 + 1/3'.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-20 flex flex-col items-center min-h-screen">
      <header className="text-center mb-8 relative w-full">
        <div className="flex flex-col items-center gap-2 mb-4">
          {!isOnline && (
            <span className="bg-amber-500/20 text-amber-400 text-[10px] px-3 py-1 rounded-full border border-amber-500/30 font-bold tracking-widest uppercase">
              Modo Offline
            </span>
          )}
          {deferredPrompt && (
            <button 
              onClick={installApp}
              className="bg-indigo-500 text-white text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-wider animate-bounce shadow-lg"
            >
              Instalar no Android
            </button>
          )}
        </div>
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          Fraction Master AI
        </h1>
        <p className="text-indigo-200 opacity-80 text-sm md:text-base">
          {isOnline ? 'A inteligência das frações no seu Android.' : 'Calculadora local otimizada.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-lg lg:max-w-6xl">
        {/* Left Side: Calculator UI */}
        <div className="glass p-6 md:p-8 rounded-[2rem] glow flex flex-col gap-4 md:gap-6">
          <div className="bg-slate-900/50 rounded-2xl p-4 md:p-6 min-h-[100px] flex items-center justify-end text-right overflow-hidden">
            <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar">
              {storedFraction && (
                <>
                  <FractionDisplay fraction={storedFraction} size="lg" className="text-indigo-300" />
                  <span className="text-2xl md:text-3xl text-indigo-500 font-bold">{operation}</span>
                </>
              )}
              <div className="flex flex-col items-center gap-1 border-2 border-indigo-500/30 p-2 rounded-xl bg-indigo-500/5 min-w-[80px]">
                <input
                  type="text"
                  placeholder="Num"
                  value={currentN}
                  readOnly
                  className="w-full bg-transparent text-center text-xl md:text-2xl font-bold focus:outline-none placeholder:text-indigo-900 placeholder:text-[10px]"
                />
                <div className="h-[2px] w-full bg-indigo-500" />
                <input
                  type="text"
                  placeholder="Den"
                  value={currentD}
                  readOnly
                  className="w-full bg-transparent text-center text-xl md:text-2xl font-bold focus:outline-none placeholder:text-indigo-900 placeholder:text-[10px]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'].map(num => (
              <button
                key={num}
                onClick={() => handleNumber(num, currentN && !currentD ? 'd' : 'n')}
                className="h-14 md:h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-xl font-semibold transition-all active:scale-95 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button onClick={clear} className="h-14 md:h-16 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xl font-bold active:scale-95">C</button>
            <button onClick={calculate} className="h-14 md:h-16 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xl font-bold active:scale-95">=</button>

            <button onClick={() => setOp('+')} className="h-14 md:h-16 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-2xl font-bold active:scale-95">+</button>
            <button onClick={() => setOp('-')} className="h-14 md:h-16 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-2xl font-bold active:scale-95">-</button>
            <button onClick={() => setOp('*')} className="h-14 md:h-16 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-2xl font-bold active:scale-95">×</button>
            <button onClick={() => setOp('/')} className="h-14 md:h-16 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-2xl font-bold active:scale-95">÷</button>
          </div>

          <div className="mt-2 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <h3 className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest mb-2 text-center md:text-left">Comando de Voz ou Texto</h3>
            <form onSubmit={handleAiSolve} className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={isOnline ? "Ex: 1/2 mais 3/4" : "Ex: 1/2 + 3/4"}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <button
                type="submit"
                disabled={isAiLoading}
                className="bg-indigo-500 px-5 py-3 rounded-xl text-sm font-bold hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-lg active:scale-90"
              >
                {isAiLoading ? '...' : (isOnline ? 'IA' : '✓')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Results & History */}
        <div className="flex flex-col gap-6">
          {aiResponse && (
            <div className="glass p-6 rounded-[2rem] border-indigo-400/30 bg-indigo-400/5 animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-indigo-300 font-bold mb-4 flex items-center gap-2 text-sm">
                <span className={`p-1 rounded text-[8px] text-white font-black ${isOnline ? 'bg-indigo-500' : 'bg-amber-600'}`}>
                  {isOnline ? 'GEMINI AI' : 'OFFLINE'}
                </span>
                {aiResponse.expression}
              </h2>
              <div className="flex items-center gap-6">
                <div className="bg-indigo-500/20 p-5 rounded-3xl border border-indigo-500/20">
                  <FractionDisplay fraction={{ n: aiResponse.numerator, d: aiResponse.denominator }} size="lg" className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-indigo-100/80 leading-relaxed text-xs italic">
                    "{aiResponse.explanation}"
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="glass p-6 md:p-8 rounded-[2rem] flex-1 flex flex-col min-h-[300px]">
            <h2 className="text-xl font-bold mb-6 text-indigo-300 flex items-center justify-between">
              Recentes
              <span className="text-[10px] font-normal opacity-40 uppercase tracking-tighter">Últimos 10</span>
            </h2>
            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
                <div className="w-12 h-12 border-2 border-dashed border-indigo-400 rounded-2xl rotate-12" />
                <p className="text-sm">Histórico vazio</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {history.map((item) => (
                  <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                    <div>
                      <div className="text-[10px] text-indigo-400 mb-1 opacity-50">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="font-semibold text-white/90 text-sm">{item.expression}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/10">
                        <FractionDisplay fraction={item.result} size="md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-auto pt-12 pb-6 text-indigo-400/30 text-[10px] uppercase tracking-widest flex flex-col items-center gap-4">
        <div className="flex gap-4 items-center">
          <span>Fraction Master AI &copy; 2025</span>
          <div className="h-1 w-1 bg-white/10 rounded-full"></div>
          <span className={isOnline ? 'text-green-500/30' : 'text-amber-500/30'}>
            Status: {isOnline ? 'Conectado' : 'Local'}
          </span>
        </div>
        <p className="text-center opacity-50 px-8">Desenvolvido como PWA de Alta Performance para Android</p>
      </footer>
    </div>
  );
};

export default App;
