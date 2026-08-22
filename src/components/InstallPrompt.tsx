import React, { useState, useEffect } from 'react';
import { Download, X, Monitor, WifiOff, Wifi, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const { isOnline } = useApp();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);

    if (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) {
      setShowInstructions(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }
    setInstallEvent(null);
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  if (installed || dismissed) return null;

  return (
    <>
      {/* Status indicator */}
      {!isOnline && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-xl shadow-lg text-sm font-medium">
          <WifiOff size={16} />
          Hors ligne
        </div>
      )}
      {isOnline && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-xl shadow-lg text-sm font-medium">
          <Wifi size={16} />
          En ligne
        </div>
      )}

      {/* Install banner */}
      {!showInstructions && !installed && (
        <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 bg-white border border-amber-200 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              <img src="/IMG-20260608-WA0000.jpg" alt="Hanky Macarons" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-sm">Installer sur votre PC</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {isInIframe
                  ? "Pour installer l'application, ouvrez-la d'abord dans un nouvel onglet."
                  : "Installez Hanky Macarons comme une application sur votre ordinateur. Fonctionne même sans internet."}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 py-2 text-sm text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors font-medium"
            >
              Plus tard
            </button>
            {isInIframe ? (
              <button
                onClick={openInNewTab}
                className="flex-1 py-2 text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-medium flex items-center justify-center gap-1.5 shadow-md"
              >
                <ExternalLink size={15} />
                Ouvrir dans un onglet
              </button>
            ) : (
              <button
                onClick={handleInstall}
                className="flex-1 py-2 text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-medium flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download size={15} />
                Installer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Instructions modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Monitor size={20} className="text-amber-600" />
                Installation sur PC
              </h2>
              <button onClick={() => { setShowInstructions(false); setDismissed(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-2">Sur Google Chrome ou Edge :</p>
                <ol className="space-y-2.5 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                    <span>Cliquez sur l'icône <strong>Installer</strong> à droite de la barre d'adresse</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                    <span>Confirmez en cliquant <strong>"Installer"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                    <span>L'application apparaît sur votre bureau et dans le menu Démarrer</span>
                  </li>
                </ol>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-emerald-900 mb-1 flex items-center gap-1.5">
                  <CheckCircle size={16} /> Sans internet
                </p>
                <p className="text-xs text-emerald-700">
                  Une fois installée, l'application fonctionne sans connexion. Vos données sont sauvegardées sur votre PC.
                </p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={() => { setShowInstructions(false); setDismissed(true); }}
                className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
