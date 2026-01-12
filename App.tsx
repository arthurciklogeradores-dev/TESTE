import React, { useState, useEffect, useRef } from 'react';
import { Fraction, Operation, HistoryItem } from './types';
import { addFractions, subtractFractions, multiplyFractions, divideFractions, simplify, formatFraction } from './utils/math';
import FractionDisplay from './components/FractionDisplay';
import { solveWithAI } from './services/geminiService';
import { parseLocalFractions } from './services/localParserService';

const App: React.FC = () => {
  // Calculator State
  const [currentN, setCurrentN] = useState<string>('');
  const [currentD, setCurrentD] = useState<string>('');
  const [activeField, setActiveField] = useState<'n' | 'd'>('n');
  const [storedFraction, setStoredFraction] = useState<Fraction | null>(null);
  const [operation, setOperation] = useState<Operation>(null);

  // History & AI State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('fraction_history_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync History to LocalStorage
  useEffect(() => {
    localStorage.setItem('fraction_history_v2', JSON.stringify(history));
  }, [history]);

  // Online status monitoring
  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const vibrate = (ms: number) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  const handleNumber = (num: string) => {
    vibrate(5);
    if (activeField === 'n') setCurrentN(prev => prev + num);
    else setCurrentD(prev => prev + num);
  };

  const clear = () => {
    vibrate(10);
    setCurrentN('');
    setCurrentD('');
    setStoredFraction(null);
    setOperation(null);
    setAiResponse(null);
    setActiveField('n');
  };

  const setOp = (op: Operation) => {
    if (currentN || storedFraction) {
      vibrate(15);
      const valN = currentN === '' ? (storedFraction?.n || 0) : Number(currentN);
      const valD = currentD === '' ? (storedFraction?.d || 1) : Number(currentD);
      
      const f = simplify({ n: valN, d: valD });
      setStoredFraction(f);
      setOperation(op);
      setCurrentN('');
      setCurrentD('');
      setActiveField('n');
    }
  };

  const calculate = () => {
    if (!operation || (!currentN && !storedFraction)) return;
    vibrate(25);

    const f2 = simplify({ 
      n: Number(currentN) || 0, 
      d: Number(currentD) || 1 
    });

    const f1 = storedFraction || { n: 0, d: 1 };
    
    let result: Fraction;
    switch (operation) {
      case '+': result = addFractions(f1, f2); break;
      case '-': result = subtractFractions(f1, f2); break;
      case '*': result = multiplyFractions(f1, f2); break;
      case '/': 
        if (f2.n === 0) {
          alert("Não é possível dividir por zero!");
          return;
        }
        result = divideFractions(f1, f2); 
        break;
      default: return;
    }

    const item: HistoryItem = {
      id: crypto.randomUUID(),
      expression: `${formatFraction(f1)} ${operation} ${formatFraction(f2)}`,
      result,
      decimal: result.n / result.d,
      timestamp: Date.now()
    };

    setHistory(prev => [item, ...prev].slice(0, 15));
    setStoredFraction(result);
    setCurrentN('');
    setCurrentD('');
    setOperation(null);
    setActiveField('n');
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
        id: crypto.randomUUID(),
        expression: result.expression,
        result: { n: result.numerator, d: result.denominator },
        decimal: result.numerator / result.denominator,
        timestamp: Date.now()
      };
      setHistory(prev => [newHistory, ...prev].slice(0, 15));
      setAiInput('');
    } catch (err) {
      console.error(err);
      alert(isOnline ? "Erro ao falar com a IA. Tente novamente." : "Modo offline: use formatos como '1/2 + 3/4'.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent tracking-tighter">
              Fraction Master <span className="text-indigo-500">AI</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em] mt-1">
              {isOnline ? 'Inteligência de Frações Ativa' : 'Modo Offline Ativo'}
            </p>
          </div>
          <div className="flex gap-2">
            {!isOnline && (
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Offline
              </div>
            )}
            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
              v2.5.0
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Calculator UI (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass rounded-[2.5rem] p-6 md:p-10 border-indigo-500/10 shadow-2xl shadow-indigo-500/5 transition-all">
              
              {/* Display Area */}
              <div className="bg-slate-900/40 rounded-[2rem] p-8 min-h-[160px] flex flex-col items-end justify-center border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-4 flex-wrap justify-end">
                  {storedFraction && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                      <FractionDisplay fraction={storedFraction} size="lg" className="text-indigo-400" />
                      {operation && <span className="text-3xl font-black text-indigo-600">{operation === '*' ? '×' : operation === '/' ? '÷' : operation}</span>}
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={() => setActiveField('n')}
                        className={`text-4xl md:text-5xl font-black transition-all min-w-[60px] text-center ${activeField === 'n' ? 'text-white scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-slate-700 hover:text-slate-600'}`}
                      >
                        {currentN || '0'}
                      </button>
                      <div className={`h-1 rounded-full transition-all duration-300 ${activeField === 'n' ? 'w-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'w-8 bg-slate-800'}`} />
                      <button 
                        onClick={() => setActiveField('d')}
                        className={`text-4xl md:text-5xl font-black transition-all min-w-[60px] text-center ${activeField === 'd' ? 'text-white scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-slate-700 hover:text-slate-600'}`}
                      >
                        {currentD || '1'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-8 grid grid-cols-4 gap-3 md:gap-4">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumber(num)}
                    className="h-14 md:h-18 rounded-3xl bg-white/5 hover:bg-white/10 text-2xl font-bold transition-all active:scale-95 border border-white/5"
                  >
                    {num}
                  </button>
                ))}
                <button onClick={clear} className="h-14 md:h-18 rounded-3xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xl font-black uppercase tracking-widest border border-red-500/10 active:scale-95">C</button>
                <button onClick={calculate} className="h-14 md:h-18 rounded-3xl bg-indigo-500 hover:bg-indigo-600 text-white text-3xl font-black shadow-lg shadow-indigo-500/20 active:scale-95">=</button>

                <div className="col-span-4 grid grid-cols-4 gap-3 md:gap-4 mt-2">
                  <button onClick={() => setOp('+')} className="h-14 md:h-16 rounded-3xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-3xl font-bold active:scale-95 border border-indigo-500/10">+</button>
                  <button onClick={() => setOp('-')} className="h-14 md:h-16 rounded-3xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-3xl font-bold active:scale-95 border border-indigo-500/10">−</button>
                  <button onClick={() => setOp('*')} className="h-14 md:h-16 rounded-3xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-3xl font-bold active:scale-95 border border-indigo-500/10">×</button>
                  <button onClick={() => setOp('/')} className="h-14 md:h-16 rounded-3xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-3xl font-bold active:scale-95 border border-indigo-500/10">÷</button>
                </div>
              </div>
            </div>

            {/* Smart Input Bar */}
            <div className="glass rounded-[2rem] p-4 border-white/5">
              <form onSubmit={handleAiSolve} className="flex gap-3">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder={isOnline ? "Pergunte algo como 'Meio mais um terço'..." : "Ex: 1/2 + 3/4"}
                  className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !aiInput.trim()}
                  className="bg-indigo-500 disabled:opacity-50 px-8 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center min-w-[100px]"
                >
                  {isAiLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Resolver'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: History & AI Explanation (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* AI Result Presentation */}
            {aiResponse && (
              <div className="glass rounded-[2rem] p-8 border-indigo-500/30 bg-indigo-500/5 animate-in zoom-in-95 duration-500">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <span className="font-black text-lg">AI</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-300">Explicação Inteligente</h3>
                      <p className="text-[10px] text-indigo-400/50 uppercase font-black tracking-widest">{aiResponse.expression}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 items-center">
                   <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/5 shadow-inner">
                      <FractionDisplay fraction={{ n: aiResponse.numerator, d: aiResponse.denominator }} size="lg" className="text-white" />
                   </div>
                   <div className="flex-1">
                      <p className="text-slate-300 text-sm leading-relaxed italic opacity-80">
                        "{aiResponse.explanation}"
                      </p>
                   </div>
                </div>
              </div>
            )}

            {/* History List */}
            <div className="glass rounded-[2.5rem] p-8 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-400">Atividade Recente</h2>
                <button 
                  onClick={() => { setHistory([]); vibrate(50); }}
                  className="text-[10px] font-bold text-slate-600 hover:text-red-400 uppercase tracking-widest transition-colors"
                >
                  Limpar Tudo
                </button>
              </div>

              {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-700">
                   <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <p className="text-sm font-bold uppercase tracking-widest opacity-40">Nenhum cálculo ainda</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((item) => (
                    <div key={item.id} className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-indigo-500/20 transition-all hover:bg-white/[0.08]">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="text-sm font-bold text-slate-300 tracking-tight group-hover:text-white transition-colors">
                          {item.expression} =
                        </div>
                      </div>
                      <div className="bg-indigo-500/10 px-4 py-3 rounded-2xl border border-indigo-500/10 group-hover:bg-indigo-500/20 transition-all">
                        <FractionDisplay fraction={item.result} size="md" className="text-indigo-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8 pb-12">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            Fraction Master AI &copy; 2025 • High Fidelity PWA
          </p>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {isOnline ? 'Cloud Sync active' : 'Local processing'}
                </span>
             </div>
             <div className="h-4 w-px bg-white/5" />
             <span className="text-[10px] font-bold text-indigo-500/40 uppercase tracking-widest">Powered by Gemini Flash</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;