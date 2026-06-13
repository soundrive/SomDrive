import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, ArrowRight, ShieldCheck, Sparkles, XCircle, RotateCcw, Activity } from 'lucide-react';
import { Artist } from '../types';
import { dbService } from '../lib/db';

interface PaymentReturnScreenProps {
  currentUser: Artist | null;
  onNavigate: (view: any, payload?: any) => void;
  onRefreshProfile?: () => void;
}

export default function PaymentReturnScreen({ currentUser, onNavigate, onRefreshProfile }: PaymentReturnScreenProps) {
  const [params, setParams] = useState<any>({});
  const [checking, setChecking] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [profile, setProfile] = useState<Artist | null>(currentUser);
  const [attempts, setAttempts] = useState(0);
  const [pathType, setPathType] = useState<'success' | 'pending' | 'error' | 'generic'>('generic');
  const [manualStatusMessage, setManualStatusMessage] = useState<string>('');

  // Extract Mercado Pago parameters representing paths and URL query string
  useEffect(() => {
    const pathname = window.location.pathname;
    let type: 'success' | 'pending' | 'error' | 'generic' = 'generic';
    
    if (pathname.includes('/sucesso')) {
      type = 'success';
    } else if (pathname.includes('/pendente')) {
      type = 'pending';
    } else if (pathname.includes('/erro')) {
      type = 'error';
    }

    const searchParams = new URLSearchParams(window.location.search);
    const mpStatus = searchParams.get('status') || '';
    const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId') || '';
    const preapprovalId = searchParams.get('preapproval_id') || '';

    // Status-based fallback
    if (type === 'generic') {
      if (mpStatus === 'approved') {
        type = 'success';
      } else if (mpStatus === 'pending' || mpStatus === 'in_process') {
        type = 'pending';
      } else if (mpStatus === 'rejected' || mpStatus === 'failure') {
        type = 'error';
      }
    }

    setPathType(type);
    setParams({
      status: mpStatus,
      paymentId: paymentId,
      preapprovalId: preapprovalId
    });

    // Replace State to clean URL query params, keeping current pathname intact
    window.history.replaceState({}, '', pathname);
  }, []);

  // Poll user profile to check if Firestore was updated by webhook (only on success path)
  useEffect(() => {
    if (!currentUser || !currentUser.userId) return;

    // Check if user is already upgraded
    const curUser = dbService.getCurrentUser();
    if (curUser && curUser.plan && curUser.plan !== 'free') {
      setIsActivated(true);
      setProfile(curUser);
      return;
    }

    if (pathType !== 'success') return;

    setChecking(true);
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
        console.warn("[PaymentReturn] Retrying profile poll due to warning: ", err);
      }

      setAttempts(prev => {
        if (prev >= 12) { // Poll for up to 24 seconds automatically
          clearInterval(interval);
          setChecking(false);
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser, pathType]);

  // Handle manual verify that triggers database check and on-demand background verification
  const handleVerifyManually = async (isPendingAction = false) => {
    if (!currentUser || !currentUser.userId) return;
    
    setChecking(true);
    setManualStatusMessage(isPendingAction ? "Consultando transações do Mercado Pago..." : "Buscando atualizações de assinatura...");

    try {
      // Direct webhook manual check if paymentId exists - solves latency issues perfectly
      if (params.paymentId) {
        await fetch('/api/mercadopago-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_payment',
            paymentId: String(params.paymentId).trim()
          })
        });
      }

      // Sync Firestore profile data
      await dbService.syncArtistData(currentUser.userId);
      const latestProfile = dbService.getArtist(currentUser.userId);
      
      if (latestProfile) {
        setProfile(latestProfile);
        if (latestProfile.plan && latestProfile.plan !== 'free') {
          setIsActivated(true);
          setManualStatusMessage("Plano ativado com sucesso!");
          if (onRefreshProfile) onRefreshProfile();
        } else {
          setManualStatusMessage("Ainda não recebemos a aprovação. Se você acabou de pagar, aguarde de 1 a 2 minutos para a compensação real.");
        }
      }
    } catch (err) {
      console.error("[PaymentReturn] Manual check failed error:", err);
      setManualStatusMessage("Erro ao consultar informações com servidor. Tente novamente.");
    } finally {
      setChecking(false);
    }
  };

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
          <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" /> Status de Pagamento
        </div>

        {/* 1. SUCCESS STATE (Or plan is already activated) */}
        {(pathType === 'success' || isActivated) ? (
          <div className="space-y-6">
            <div className="w-18 h-18 bg-emerald-950/50 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10 fill-emerald-950" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-heading font-black text-white tracking-tight text-emerald-400">
                Pagamento aprovado!
              </h3>
              <p className="text-sm text-slate-300 font-semibold">
                Estamos ativando seu plano.
              </p>
              <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
                Parabéns! Sua assinatura foi reconhecida. O seu limite de cadastro de canções e recursos exclusivos já foram liberados em sua conta.
              </p>
            </div>

            {profile && (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 inline-block text-left text-xs space-y-1.5 font-mono text-slate-400 w-full">
                <p><strong className="text-slate-500 uppercase">Assinante:</strong> {profile.displayName || profile.email}</p>
                <p><strong className="text-slate-500 uppercase">Novo plano:</strong> <span className="text-orange-400 font-bold uppercase">{profile.plan || 'PRO'}</span></p>
                <p><strong className="text-slate-500 uppercase">Limite de músicas:</strong> {profile.musicLimit || 15} músicas</p>
                <p><strong className="text-slate-500 uppercase">Status:</strong> <span className="text-emerald-400 font-bold">ATIVO ⭐</span></p>
              </div>
            )}

            {manualStatusMessage && (
              <p className="text-xs text-amber-400 font-mono italic leading-snug bg-amber-950/10 p-2.5 rounded-lg border border-amber-500/10">
                {manualStatusMessage}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGoToDashboard}
                className="flex-1 py-3 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-450 hover:brightness-110 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                id="btn-sucesso-painel"
              >
                Ir para o Meu Painel <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleVerifyManually(false)}
                className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                id="btn-sucesso-ver-plano"
              >
                <Activity className="w-3.5 h-3.5" /> Ver meu plano
              </button>
            </div>
          </div>

        /* 2. PENDING STATE */
        ) : pathType === 'pending' ? (
          <div className="space-y-6">
            <div className="w-18 h-18 bg-amber-950/40 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400 animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-heading font-bold text-amber-300 tracking-tight">
                Pagamento recebido e aguardando confirmação.
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                O gateway de pagamento está validando os seus fundos. Transações Pix costumam concluir em segundos, mentre cartões de crédito dependem do processamento do banco.
              </p>
            </div>

            {checking && (
              <div className="py-2 flex items-center justify-center gap-2 text-xs text-amber-400 font-mono">
                <div className="w-3 h-3 border border-t-amber-400 border-transparent rounded-full animate-spin"></div>
                Sincronizando com o servidor...
              </div>
            )}

            {manualStatusMessage && (
              <p className="text-xs text-orange-400 font-mono leading-snug bg-orange-950/10 p-3 rounded-xl border border-orange-500/10">
                {manualStatusMessage}
              </p>
            )}

            <div className="pt-2 flex flex-col space-y-3">
              <button
                onClick={() => handleVerifyManually(true)}
                disabled={checking}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                id="btn-pendente-verificar"
              >
                <RotateCcw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} /> Já paguei — Verificar novamente
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                id="btn-pendente-painel"
              >
                Voltar ao Painel
              </button>
            </div>
          </div>

        /* 3. ERROR STATE */
        ) : pathType === 'error' ? (
          <div className="space-y-6">
            <div className="w-18 h-18 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-heading font-bold text-red-400 tracking-tight">
                O pagamento não foi concluído.
              </h3>
              <p className="text-xs text-slate-350 leading-relaxed max-w-sm mx-auto">
                A transação não pôde ser confirmada ou foi recusada pelo Mercado Pago. Por favor, revise as suas credenciais de pagamento ou tente outro método.
              </p>
            </div>

            <div className="pt-2 flex flex-col space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3.5 bg-red-650 hover:bg-red-650/90 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                id="btn-erro-tentar"
              >
                Tentar novamente
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-750 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                id="btn-erro-painel"
              >
                Voltar ao Painel
              </button>
            </div>
          </div>

        /* 4. GENERIC STATE */
        ) : (
          <div className="space-y-6">
            <div className="w-18 h-18 bg-slate-950/40 border border-slate-755 rounded-full flex items-center justify-center mx-auto text-slate-400 animate-pulse">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-heading font-bold text-slate-200 tracking-tight">
                Verificação de Assinatura
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Olá! Estamos verificando o status da sua transação no Mercado Pago para atualizar os privilégios da sua conta no SomDrive.
              </p>
            </div>

            {checking && (
              <div className="py-2 flex items-center justify-center gap-2 text-xs text-orange-400 font-mono">
                <div className="w-3 h-3 border border-t-orange-400 border-transparent rounded-full animate-spin"></div>
                Sincronizando...
              </div>
            )}

            <div className="pt-2 flex flex-col space-y-3">
              <button
                onClick={() => handleVerifyManually(false)}
                disabled={checking}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                id="btn-generic-verificar"
              >
                Sincronizar Conta e Limites
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-70 transition text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                id="btn-generic-painel"
              >
                Voltar ao Painel
              </button>
            </div>
          </div>
        )}

        {/* Footer info badge */}
        <div className="pt-4 text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1 uppercase tracking-wider border-t border-slate-850/40">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> SomDrive • Transação Integrada Segura
        </div>

      </div>
    </div>
  );
}
