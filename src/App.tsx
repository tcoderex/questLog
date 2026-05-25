import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Trash2, Copy, Sword, XCircle, Info, Minus, X, Wifi, WifiOff, RefreshCw, Globe } from 'lucide-react';

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
  const [copiedQuestId, setCopiedQuestId] = useState<string | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCheckSWUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateStatus('Sensing atmospheric changes... (polling service worker)');
    
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          setUpdateStatus('Checking remote repository on Vercel...');
          await registration.update();
          
          if (registration.waiting) {
            setUpdateStatus('An upgrade is waiting. Activating new runes shortly!');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            setTimeout(() => {
              setUpdateStatus('Your local runes match the latest Github code! You are fully upgraded.');
              setCheckingUpdate(false);
            }, 1500);
          }
        } else {
          setTimeout(() => {
            setUpdateStatus('Service worker is not registered yet. It will run automatically once the page is fully ready.');
            setCheckingUpdate(false);
          }, 1500);
        }
      } catch (err) {
        setUpdateStatus('Failed to check automatically: ' + String(err));
        setCheckingUpdate(false);
      }
    } else {
      setTimeout(() => {
        setUpdateStatus('Service Workers are not supported: Check if your browser is in secure contexts (HTTPS).');
        setCheckingUpdate(false);
      }, 1000);
    }
  };

  const handleForceUpdateLocal = () => {
    setCheckingUpdate(true);
    setUpdateStatus('Clearing local cache registers and refreshing...');
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleCloseApp = () => {
    setIsExiting(true);
    // Allow the 450ms exit CSS animation to run before invoking Tauri's window closing API
    setTimeout(() => {
      const tauriWindow = (window as any).__TAURI__?.window?.getCurrentWindow();
      if (tauriWindow) {
        tauriWindow.close();
      } else {
        // Fallback for visual experience inside browser / iframe preview
        setIsClosed(true);
      }
    }, 450);
  };

  const handleMinimizeApp = () => {
    const tauriWindow = (window as any).__TAURI__?.window?.getCurrentWindow();
    if (tauriWindow) {
      tauriWindow.minimize();
    } else {
      setIsMinimized(true);
    }
  };
  
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

  const handleCopyQuest = (quest: Quest, e: React.MouseEvent) => {
    e.stopPropagation();
    const rune = `[${quest.completed ? 'x' : ' '}] ${quest.text}`;
    navigator.clipboard.writeText(rune).then(() => {
      setCopiedQuestId(quest.id);
      setTimeout(() => setCopiedQuestId(null), 1500);
    });
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
    <div className="h-screen w-full flex flex-col items-center justify-center font-sans selection:bg-[#d4af37]/30 p-2 sm:p-6 overflow-hidden">
      
      {isClosed ? (
        <button 
          onClick={() => {
            setIsExiting(false);
            setIsClosed(false);
          }}
          className="border border-[#444] hover:border-[#d4af37] bg-black/80 p-8 cursor-pointer relative flex flex-col items-center gap-4 transition-all skyrim-entrance"
        >
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37] opacity-60"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37] opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37] opacity-60"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37] opacity-60"></div>
          <span className="font-display tracking-widest text-[#ececec] text-lg uppercase">The Scrolls Have Closed</span>
          <span className="font-serif italic text-xs text-[#d4af37] hover:underline">Click to unroll the runes again.</span>
        </button>
      ) : isMinimized ? (
        <button 
          onClick={() => setIsMinimized(false)}
          className="border border-[#d4af37] bg-black/80 hover:bg-[#d4af37]/10 p-6 md:p-8 cursor-pointer relative flex flex-col items-center gap-4 transition-all skyrim-entrance"
        >
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37] opacity-60"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37] opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37] opacity-60"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37] opacity-60"></div>
          <Sword className="text-[#d4af37] animate-pulse" size={32} />
          <span className="font-display tracking-widest text-[#d4af37] text-lg uppercase">Quest Log Minimized</span>
          <span className="font-serif italic text-xs text-[#a1a1aa]">Click here to restore objectives.</span>
        </button>
      ) : (
        <div 
          className={`w-full max-w-2xl flex flex-col items-center h-full max-h-[85vh] justify-center min-h-0 skyrim-entrance ${isExiting ? 'fade-out-exit' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={handleContextMenu}
        >
          {/* Decorative Top Frame */}
          <div className="w-full flex items-center justify-center mb-3 sm:mb-5 opacity-80 pointer-events-none select-none flex-shrink-0">
            <div className="h-px bg-gradient-to-r from-transparent to-[#d4af37] w-1/4"></div>
            <div className="w-3 h-3 border border-[#d4af37] rotate-45 mx-4"></div>
            <div className="h-px bg-gradient-to-l from-transparent to-[#d4af37] w-1/4"></div>
          </div>

          <div className="w-full bg-black/40 backdrop-blur-md border border-[#ffffff15] shadow-2xl p-4 sm:p-6 md:p-8 relative flex flex-col flex-1 min-h-0">
            {/* Custom Skyrim Window Controls */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <button
                onClick={handleMinimizeApp}
                title="Minimize Application"
                className="w-6 h-6 flex items-center justify-center border border-[#d4af37]/35 bg-black/60 hover:bg-[#d4af37]/20 text-[#d4af37] cursor-pointer transition-colors"
              >
                <Minus size={11} strokeWidth={3} />
              </button>
              <button
                onClick={handleCloseApp}
                title="Exit Quest Log"
                className="w-6 h-6 flex items-center justify-center border border-[#d4af37]/35 bg-black/60 hover:bg-red-950/40 hover:border-red-500/60 hover:text-red-400 text-[#d4af37] cursor-pointer transition-colors"
              >
                <X size={11} strokeWidth={3} />
              </button>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#d4af37] opacity-50"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#d4af37] opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#d4af37] opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#d4af37] opacity-50"></div>

            <header className="mb-4 sm:mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0">
            <div 
              className="flex items-center gap-4 cursor-pointer group w-fit"
              onClick={() => setShowCredits(true)}
            >
              <Sword size={28} className="text-[#d4af37] opacity-70 group-hover:opacity-100 transition-opacity" />
              <div>
                <h1 className="font-display text-3xl md:text-4xl tracking-widest text-[#ececec] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-[#d4af37] transition-colors">
                  Quest Log
                </h1>
                <p className="text-[#a1a1aa] font-serif italic mt-1 text-base">
                  Scribe your objectives, then export the runes.
                </p>
              </div>
            </div>

            {/* Quick Export Runes Button */}
            <button
              onClick={handleCopy}
              disabled={quests.length === 0}
              className={`font-display text-xs tracking-widest uppercase py-2 px-4 border transition-all duration-300 relative group flex items-center justify-center gap-2 overflow-hidden max-md:w-full ${
                quests.length === 0
                  ? 'border-[#444]/40 text-[#666] opacity-40 cursor-not-allowed'
                  : copied
                    ? 'border-[#ececec] bg-[#ececec]/10 text-[#ececec] cursor-default'
                    : 'border-[#d4af37]/45 hover:border-[#d4af37] bg-[#d4af37]/5 hover:bg-[#d4af37]/10 text-[#d4af37] cursor-pointer'
              }`}
            >
              <span className={`transition-transform duration-200 ${copied ? 'scale-95 font-medium' : ''}`}>
                {copied ? 'Runes Scribed' : 'Export Runes'}
              </span>
              {/* Subtle shining light effects on hover */}
              {quests.length > 0 && !copied && (
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                  <div className="w-[150%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                </div>
              )}
            </button>
          </header>

          <Divider />

          {/* Quest Input */}
          <div className="relative group my-3 sm:my-5 flex-shrink-0">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity px-4 pointer-events-none">
              <span className="font-display text-[#d4af37] text-lg">»</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What befell you? (Press Enter to add)..."
              className="w-full bg-black/60 border border-transparent border-b-[#404040] focus:border-b-[#d4af37] outline-none pl-10 pr-4 py-3 text-base md:text-lg text-[#ececec] placeholder-[#666] transition-colors focus:bg-black/80 font-serif italic focus:not-italic"
            />
          </div>

          {/* Quest List */}
          <div ref={scrollRef} className="flex flex-col gap-1 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
            {quests.length === 0 ? (
              <div className="h-full mt-10 flex flex-col items-center justify-center text-[#555] font-display uppercase tracking-widest space-y-4 text-sm">
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
                    className={`group relative flex flex-row items-start gap-3 md:gap-4 p-3 md:p-4 cursor-pointer transition-colors border border-transparent hover:border-[#ffffff10] hover:bg-white/5 ${
                      quest.completed ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    <QuestMarker completed={quest.completed} />
                    
                    <span
                      className={`flex-1 text-base md:text-lg leading-relaxed transition-all ${
                        quest.completed ? 'text-[#8a8a8a] line-through decoration-black/50' : 'text-[#ececec]'
                      }`}
                    >
                      {quest.text}
                    </span>

                    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleCopyQuest(quest, e)}
                        className={`font-display text-[10px] md:text-xs px-2 py-1 tracking-widest transition-all duration-150 ${
                          copiedQuestId === quest.id 
                            ? 'text-[#d4af37] opacity-100 font-medium' 
                            : 'opacity-40 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#666] hover:text-[#d4af37]'
                        }`}
                      >
                        {copiedQuestId === quest.id ? 'Scribed' : 'Copy'}
                      </button>

                      <button
                        onClick={(e) => removeQuest(quest.id, e)}
                        className="opacity-40 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#666] hover:text-red-400 font-display text-[10px] md:text-xs px-2 py-1 tracking-widest transition-opacity"
                      >
                        Drop
                      </button>
                    </div>
                    
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
          <div className="mt-4 pt-4 sm:mt-5 sm:pt-5 border-t border-[#ffffff10] text-center select-none pointer-events-none flex-shrink-0">
            <p className="font-display text-[10px] tracking-widest uppercase text-[#555]">
              Hold touch or Right-click here for System Menu
            </p>
          </div>
          
        </div>
        
        {/* Decorative Bottom Frame */}
        <div className="w-full flex items-center justify-center mt-3 sm:mt-5 opacity-80 pointer-events-none select-none flex-shrink-0">
          <div className="h-px bg-gradient-to-r from-transparent to-[#d4af37] w-1/4"></div>
          <div className="w-3 h-3 border border-[#d4af37] rotate-45 mx-4"></div>
          <div className="h-px bg-gradient-to-l from-transparent to-[#d4af37] w-1/4"></div>
        </div>
      </div>
      )}

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

      {/* Credits / Runes Synchronizer Overlay */}
      <AnimatePresence>
        {showCredits && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setShowCredits(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-[#d4af37]/45 shadow-[0_0_60px_rgba(212,175,55,0.08)] p-6 md:p-8 max-w-lg w-full relative flex flex-col items-center text-center my-8"
              onClick={e => e.stopPropagation()}
            >
              {/* Corner Ornaments */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#d4af37] opacity-80"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#d4af37] opacity-80"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#d4af37] opacity-80"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#d4af37] opacity-80"></div>

              <Sword size={36} className="text-[#d4af37] mb-2 drop-shadow-md" />
              <h2 className="font-display text-2xl text-[#ececec] uppercase tracking-widest mb-1">A Masterwork</h2>
              <p className="text-[#a1a1aa] font-serif italic text-base leading-relaxed">
                Forged in client-side runes of Google AI Studio.<br />
                Crafted by <span className="text-[#d4af37] not-italic font-display uppercase tracking-wider text-xs ml-1">tcoderex (wasim dorboz)</span>
              </p>
              
              <Divider />

              <div className="w-full space-y-4 my-2 text-[#ececec] text-left">
                {/* Active Status Display and Description */}
                <div className="border border-[#ffffff10] bg-white/[0.02] p-4 font-serif italic text-[#a1a1aa] text-sm space-y-2">
                  <div className="flex items-center justify-between text-xs font-display not-italic tracking-wider uppercase text-[#d4af37]/80">
                    <span>Atmospheric Connection</span>
                    <span className={isOnline ? 'text-green-400 font-display flex items-center gap-1.5' : 'text-zinc-500 flex items-center gap-1.5'}>
                      {isOnline ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-zinc-500" />}
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {isOnline 
                      ? 'The paths to Tamriel are active! Your local runes can synchronize with your branch on Vercel immediately.' 
                      : 'The sky is thick with storm. Direct synchronization is not possible, but local objectives remain perfectly stored inside browser memories.'}
                  </p>
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-display text-[10px] text-[#d4af37] tracking-widest uppercase">How to upgrade your log:</h3>
                  <p className="font-sans text-xs text-[#a1a1aa] leading-relaxed">
                    Pushing code to your GitHub triggers a fresh build on Vercel. Click <strong className="text-[#ececec]">Upgrade Runes</strong> below to instantly pull the latest spells!
                  </p>
                </div>

                {updateStatus && (
                  <div className="border border-[#d4af37]/30 bg-[#d4af37]/5 px-4 py-2.5 text-xs font-mono text-center select-text selection:bg-[#d4af37]/40 text-[#ececec]">
                    {updateStatus}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full mt-4 flex flex-col gap-2.5">
                <button
                  onClick={handleCheckSWUpdate}
                  disabled={checkingUpdate || !isOnline}
                  className={`w-full font-display uppercase tracking-widest text-xs py-3.5 px-4 border text-center transition-all flex items-center justify-center gap-2 ${
                    checkingUpdate
                      ? 'border-[#444] text-[#666] cursor-not-allowed'
                      : !isOnline
                        ? 'border-[#333] text-[#555] cursor-not-allowed opacity-50'
                        : 'border-[#d4af37] bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] hover:border-[#ececec] hover:text-[#ececec] cursor-pointer skyrim-glow'
                  }`}
                >
                  <RefreshCw size={12} className={checkingUpdate ? 'animate-spin' : isOnline ? 'animate-spin [animation-duration:8s]' : ''} />
                  <span>{checkingUpdate ? 'Sensing Elements...' : isOnline ? 'Upgrade Runes (Glows!)' : 'Offline Mode (Working Local)'}</span>
                </button>

                <div className="flex w-full gap-2.5">
                  <button
                    onClick={handleForceUpdateLocal}
                    disabled={checkingUpdate}
                    className="flex-1 font-display uppercase tracking-widest text-[10px] py-2.5 px-3 border border-[#444] hover:bg-red-950/20 hover:border-red-500/50 hover:text-red-400 text-[#a1a1aa] text-center cursor-pointer transition-all"
                  >
                    Force Clear Caches
                  </button>

                  <button
                    onClick={() => setShowCredits(false)}
                    className="flex-1 font-display uppercase tracking-widest text-[10px] py-2.5 px-3 border border-transparent hover:border-white/20 text-[#ececec] hover:text-[#d4af37] bg-white/5 text-center cursor-pointer transition-colors"
                  >
                    Return
                  </button>
                </div>
              </div>

              {/* Secure public address links if online */}
              {isOnline && (
                <div className="w-full mt-4 pt-3 border-t border-[#ffffff10] flex items-center justify-between text-[10px] text-[#555] font-display uppercase tracking-wider">
                  <span>Deployment Link:</span>
                  <a 
                    href="https://quest-log-red.vercel.app" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[#d4af37] hover:underline flex items-center gap-1 normal-case font-serif italic text-xs"
                  >
                    <Globe size={10} className="not-italic" /> quest-log-red.vercel.app
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
