import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Trash2, Copy, Sword, XCircle, Info } from 'lucide-react';

interface Quest {
  id: string;
  text: string;
  completed: boolean;
}

const MenuItem = ({ label, hotkey, onClick, icon: Icon, highlight = false, disabled = false }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className="group w-full flex items-center justify-between py-3 px-4 transition-colors hover:bg-white/5 border border-transparent hover:border-[#ffffff10] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
  >
    <div className="flex items-center gap-4">
      <div className={`w-1.5 h-1.5 rotate-45 transition-colors ${highlight ? 'bg-[#d4af37]' : 'bg-transparent group-hover:bg-[#d4af37]'}`}></div>
      <span className={`font-display tracking-widest text-lg md:text-xl uppercase transition-colors ${highlight ? 'text-[#d4af37]' : 'text-[#ececec] group-hover:text-[#d4af37]'}`}>
        {label}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {hotkey && <span className="font-display text-[10px] md:text-xs text-[#a1a1aa] tracking-widest border border-[#333] px-1.5 py-0.5 group-hover:border-[#666] transition-colors">{hotkey}</span>}
      {Icon && <Icon size={18} className={`hidden md:block transition-colors ${highlight ? 'text-[#d4af37]' : 'text-[#666] group-hover:text-[#a1a1aa]'}`} />}
    </div>
  </button>
);

const Divider = () => (
  <div className="flex items-center w-full opacity-60 my-4">
    <div className="w-1.5 h-1.5 bg-[#d4af37] rotate-45 flex-shrink-0"></div>
    <div className="h-px bg-gradient-to-r from-[#d4af37] via-[#d4af37]/40 to-transparent flex-1 ml-2"></div>
  </div>
);

const QuestMarker = ({ completed }: { completed: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="drop-shadow-md flex-shrink-0 mt-0.5">
    <path 
      d="M12 2.5L21.5 12L12 21.5L2.5 12L12 2.5Z" 
      stroke={completed ? '#8a8a8a' : '#d4af37'} 
      strokeWidth="1.5" 
      fill={completed ? '#8a8a8a' : 'rgba(0,0,0,0.4)'}
    />
    {completed && (
      <path d="M12 7L17 12L12 17L7 12L12 7Z" fill="#111" />
    )}
  </svg>
);

export default function App() {
  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('skyrim-quests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input')) return;
    
    touchStartPos.current = { x: e.clientX, y: e.clientY };
    
    pressTimer.current = setTimeout(() => {
      setShowMenu(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pressTimer.current) {
      const dx = Math.abs(e.clientX - touchStartPos.current.x);
      const dy = Math.abs(e.clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input')) return;
    e.preventDefault();
    setShowMenu(true);
  };

  useEffect(() => {
    localStorage.setItem('skyrim-quests', JSON.stringify(quests));
    // Auto-scroll when new quests are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [quests]);

  // Global keybinds
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      if (e.altKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleDeleteCompleted();
      }
      if (e.key === 'Escape') {
        setShowMenu(false);
        setShowCredits(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, [quests]);

  const handleSelectAll = () => {
    const allCompleted = quests.length > 0 && quests.every(q => q.completed);
    setQuests(quests.map(q => ({ ...q, completed: !allCompleted })));
  };

  const handleDeleteCompleted = () => {
    setQuests(quests.filter(q => !q.completed));
  };

  const handleAddQuest = () => {
    if (inputValue.trim()) {
      setQuests([...quests, { id: crypto.randomUUID(), text: inputValue.trim(), completed: false }]);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddQuest();
    }
  };

  const toggleQuest = (id: string) => {
    setQuests(quests.map(q => q.id === id ? { ...q, completed: !q.completed } : q));
  };

  const removeQuest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuests(quests.filter(q => q.id !== id));
  };

  const handleCopy = () => {
    if (quests.length === 0) return;
    
    let markdown = 'todos:\n';
    markdown += quests.map(q => `[${q.completed ? 'x' : ' '}] ${q.text}`).join('\n');
    
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Abandon all current objectives?')) {
      setQuests([]);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 sm:p-6 md:p-12 flex flex-col items-center justify-start font-sans selection:bg-[#d4af37]/30"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      
      {/* Decorative Top Frame */}
      <div className="w-full max-w-3xl flex items-center justify-center mb-6 opacity-80">
        <div className="h-px bg-gradient-to-r from-transparent to-[#d4af37] w-1/4"></div>
        <div className="w-3 h-3 border border-[#d4af37] rotate-45 mx-4"></div>
        <div className="h-px bg-gradient-to-l from-transparent to-[#d4af37] w-1/4"></div>
      </div>

      <div className="w-full max-w-3xl bg-black/40 backdrop-blur-md border border-[#ffffff15] shadow-2xl p-6 md:p-10 relative">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#d4af37] opacity-50"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#d4af37] opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#d4af37] opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#d4af37] opacity-50"></div>

        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div 
            className="flex items-center gap-4 cursor-pointer group w-fit"
            onClick={() => setShowCredits(true)}
          >
            <Sword size={36} className="text-[#d4af37] opacity-70 group-hover:opacity-100 transition-opacity" />
            <div>
              <h1 className="font-display text-4xl md:text-5xl tracking-widest text-[#ececec] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-[#d4af37] transition-colors">
                Quest Log
              </h1>
              <p className="text-[#a1a1aa] font-serif italic mt-2 text-lg">
                Scribe your objectives, then export the runes.
              </p>
            </div>
          </div>
        </header>

        <Divider />

        {/* Quest Input */}
        <div className="relative group my-6">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity px-4 pointer-events-none">
            <span className="font-display text-[#d4af37] text-xl">»</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What befell you? (Press Enter to add)..."
            className="w-full bg-black/60 border border-transparent border-b-[#404040] focus:border-b-[#d4af37] outline-none pl-10 md:pl-12 pr-4 py-3 md:py-4 text-lg md:text-xl text-[#ececec] placeholder-[#666] transition-colors focus:bg-black/80 font-serif italic focus:not-italic"
          />
        </div>

        {/* Quest List */}
        <div ref={scrollRef} className="flex flex-col gap-1 min-h-[40vh] max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {quests.length === 0 ? (
            <div className="h-full mt-12 flex flex-col items-center justify-center text-[#555] font-display uppercase tracking-widest space-y-4">
              <p>No Active Objectives</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {quests.map((quest) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={quest.id}
                  onClick={() => toggleQuest(quest.id)}
                  className={`group relative flex flex-row items-start gap-4 p-4 cursor-pointer transition-colors border border-transparent hover:border-[#ffffff10] hover:bg-white/5 ${
                    quest.completed ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <QuestMarker completed={quest.completed} />
                  
                  <span
                    className={`flex-1 text-xl leading-relaxed transition-all ${
                      quest.completed ? 'text-[#8a8a8a] line-through decoration-black/50' : 'text-[#ececec]'
                    }`}
                  >
                    {quest.text}
                  </span>

                  <button
                    onClick={(e) => removeQuest(quest.id, e)}
                    className="opacity-40 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#666] hover:text-red-400 font-display text-xs md:text-sm px-2 py-1 tracking-widest transition-opacity"
                  >
                    Drop
                  </button>
                  
                  {/* Active Indicator on hover */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-8 bg-gradient-to-b from-transparent via-[#d4af37] to-transparent"></div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* Hint for master menu */}
        <div className="mt-8 pt-6 border-t border-[#ffffff10] text-center select-none pointer-events-none">
          <p className="font-display text-[10px] md:text-xs tracking-widest uppercase text-[#555]">
            Hold touch or Right-click anywhere for System Menu
          </p>
        </div>
        
      </div>
      
      {/* Decorative Bottom Frame */}
      <div className="w-full max-w-3xl flex items-center justify-center mt-6 opacity-80 pointer-events-none select-none">
        <div className="h-px bg-gradient-to-r from-transparent to-[#d4af37] w-1/4"></div>
        <div className="w-3 h-3 border border-[#d4af37] rotate-45 mx-4"></div>
        <div className="h-px bg-gradient-to-l from-transparent to-[#d4af37] w-1/4"></div>
      </div>

      {/* Master Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowMenu(false)}
            onContextMenu={(e) => { e.preventDefault(); setShowMenu(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="max-w-md w-full bg-[#050505]/95 border border-[#d4af37]/40 shadow-[0_0_50px_rgba(212,175,55,0.05)] p-1 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="border border-[#ffffff10] flex flex-col relative px-2 py-6 md:px-6 md:py-8">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#d4af37] opacity-60"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#d4af37] opacity-60"></div>
                
                <h2 className="font-display text-3xl text-[#ececec] uppercase tracking-widest mb-2 px-4 shadow-black drop-shadow-md">System Menu</h2>
                <div className="px-3 mb-4">
                  <div className="h-px bg-gradient-to-r from-[#d4af37] via-[#d4af37]/40 to-transparent w-full opacity-60"></div>
                </div>

                <div className="flex flex-col gap-1">
                  <MenuItem label={copied ? 'Exported Runes' : 'Export Runes'} hotkey="ALT+C" icon={Copy} disabled={quests.length === 0} highlight={copied} onClick={() => { handleCopy(); setShowMenu(false); }} />
                  <MenuItem label="Toggle All" hotkey="ALT+A" icon={CheckSquare} disabled={quests.length === 0} onClick={() => { handleSelectAll(); setShowMenu(false); }} />
                  <MenuItem label="Drop Marked" hotkey="ALT+X" icon={Trash2} disabled={quests.length === 0} onClick={() => { handleDeleteCompleted(); setShowMenu(false); }} />
                  <MenuItem label="Abandon All" hotkey="DEL" icon={XCircle} disabled={quests.length === 0} onClick={() => { handleClearAll(); setShowMenu(false); }} />
                  <div className="my-2 mx-4 h-px bg-[#ffffff10]"></div>
                  <MenuItem label="Credits" icon={Info} onClick={() => { setShowMenu(false); setShowCredits(true); }} />
                  <MenuItem label="Return" hotkey="ESC" onClick={() => setShowMenu(false)} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credits Overlay */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-[#d4af37]/30 shadow-[0_0_50px_rgba(212,175,55,0.05)] p-8 max-w-md w-full relative flex flex-col items-center text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#d4af37] opacity-60"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#d4af37] opacity-60"></div>
              
              <Sword size={40} className="text-[#d4af37] mb-6 drop-shadow-md" />
              <h2 className="font-display text-2xl text-[#ececec] uppercase tracking-widest mb-2">A Masterwork</h2>
              <Divider />
              <p className="text-[#a1a1aa] font-serif italic text-xl my-6 leading-relaxed">
                Forged in the fires of Google AI Studio. <br />
                Crafted by <span className="text-[#d4af37] not-italic font-display uppercase tracking-wider text-sm ml-1">tcoderex (wasim dorboz)</span>
              </p>
              
              <button
                onClick={() => setShowCredits(false)}
                className="mt-4 font-display uppercase tracking-widest text-sm text-[#ececec] hover:text-[#d4af37] transition-colors border border-transparent hover:border-[#d4af37]/40 px-8 py-3 bg-white/5 cursor-pointer"
              >
                Return
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
