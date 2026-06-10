import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, ArrowRight, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { Artist } from '../types';
import { dbService } from '../lib/db';

interface PaymentReturnScreenProps {
  currentUser: Artist | null;
  onNavigate: (view: any, payload?: any) => void;
  onRefreshProfile?: () => void;
}

export default function PaymentReturnScreen({ currentUser, onNavigate, onRefreshProfile }: PaymentReturnScreenProps) {
  const [params, setParams] = useState<any>({});
  const [checking, setChecking] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [profile, setProfile] = useState<Artist | null>(currentUser);
  const [attempts, setAttempts] = useState(0);

  // Extract Mercado Pago parameters from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mpStatus = searchParams.get('status') || '';
    const paymentId = searchParams.get('payment_id') || '';
    const preapprovalId = searchParams.get('preapproval_id') || '';
    
    setParams({
      status: mpStatus,
      paymentId: paymentId,
      preapprovalId: preapprovalId
    });

    // Clean up URL search parameters to keep the layout address bar pristine
    window.history.replaceState({}, '', '/pagamento/retorno');
  }, []);

  // Poll user profile to check if Firestore was updated by webhook
  useEffect(() => {
    if (!currentUser || !currentUser.userId) return;

    // Direct check first
    if (currentUser.plan && currentUser.plan !== 'free') {
      setIsActivated(true);
      setChecking(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        console.log("[PaymentReturn] Polling Firestore for upgraded plan status...");
        await dbService.syncArtistData(currentUser.userId);
        const latestProfile = dbService.getArtist(currentUser.userId);
        
        if (latestProfile) {
          setProfile(latestProfile);
          if (latestProfile.plan && latestProfile.plan !== 'free') {
            setIsActivated(true);
            setChecking(false);
            clearInterval(interval);
            if (onRefreshProfile) onRefreshProfile();
          }
        }
      } catch (err) {
        console.warn("[PaymentReturn] Retrying profile poll: ", err);
      }

      setAttempts(prev => {
        if (prev >= 6) { // Stop polling after 12 seconds
          clearInterval(interval);
          setChecking(false);
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser, attempts]);

  const handleGoToDashboard = () => {
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#06080d] flex items-center justify-center px-4 relative overflow-hidden select-none">
      
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-orange-650/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-yellow-600/5 rounded-full blur-[90px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-850/60 p-8 md:p-10 rounded-3xl text-center space-y-6 md:space-y-8 relative z-10 backdrop-blur-md">
        
        {/* Animated Badge Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-950/40 to-yellow-950/40 border border-orange-500/10 text-orange-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest leading-none">
          <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" /> Retorno de Pagamento
        </div>

        {checking ? (
          /* PENDING / PROCESSING STATE */
          <div className="space-y-6">
            <div className="w-18 h-18 bg-orange-950/30 border-2 border-t-orange-500 border-orange-950/10 rounded-full animate-spin mx-auto flex items-center justify-center shadow-lg shadow-orange-950/20">
              <Clock className="w-8 h-8 text-orange-400 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-heading font-black text-white tracking-tight">
                Estamos confirmando seu pagamento...
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Confirmamos o seu checkout no Mercado Pago! Estamos ativando os seus limites ampliados em segundo plano. Isto leva apenas alguns instantes...
              </p>
            </div>
            
            <div className="text-[10px] text-slate-500 font-mono">
              Tentativa de sincronização: {attempts}/6
            </div>
          </div>
        ) : isActivated ? (
          /* SUCCESS STATE */
          <div className="space-y-6">
            <div className="w-18 h-18 bg-emerald-950/50 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10 fill-emerald-950" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-heading font-black text-white tracking-tight text-emerald-400">
                Plano ativado com sucesso
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Parabéns! O seu perfil foi atualizado para o plano <strong className="text-orange-400 uppercase">{profile?.plan || 'PRO'}</strong>. O seu limite de cadastro de músicas foi expandido instantaneamente!
              </p>
            </div>

            {profile && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-850 inline-block text-left text-[10px] space-y-1 font-mono text-slate-400 w-full max-w-xs">
                <p><strong className="text-slate-500 uppercase">Assinante:</strong> {profile.displayName || profile.email}</p>
                <p><strong className="text-slate-500 uppercase">Novo Limite:</strong> {profile.musicLimit} músicas</p>
                <p><strong className="text-slate-500 uppercase">Status:</strong> ATIVO ⭐</p>
              </div>
            )}
          </div>
        ) : (
          /* FALLBACK / MANUAL CONFIRMATION OR UNCHANGED STATE */
          <div className="space-y-6">
            <div className="w-18 h-18 bg-amber-950/40 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400 animate-pulse">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-heading font-bold text-amber-300 tracking-tight">
                Pagamento recebido ou em análise. Aguarde alguns instantes e atualize.
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Seu pagamento foi confirmado pelo gateway. Caso os novos limites ainda não tenham aparecido por favor aguarde de 1 a 2 minutos para a propagação da API ou fale com nosso suporte.
              </p>
              <button
                onClick={() => { setAttempts(0); setChecking(true); }}
                className="mt-4 px-4 py-2 bg-slate-800 text-xs hover:bg-slate-700 transition font-bold uppercase tracking-wider text-white rounded-lg cursor-pointer"
              >
                Atualizar e Tentar Sincronizar
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Navigation button controls */}
        <div className="pt-4 flex flex-col space-y-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-400 hover:brightness-110 text-slate-950 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 font-black shadow-lg shadow-orange-500/10"
          >
            Ir para o Meu Painel <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Soundrive • Redirecionamento Seguro
          </div>
        </div>

      </div>
    </div>
  );
}
