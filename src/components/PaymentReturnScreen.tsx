import React, { useState, useEffect, useRef } from 'react';
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
  const [pathType, setPathType] = useState<'success' | 'pending' | 'error' | 'generic'>('generic');
  const [manualStatusMessage, setManualStatusMessage] = useState<string>('');
  
  // Enforce a minimum loader layout of 3 seconds on success page to give perfect visual feedback and let webhook complete
  const [minLoadingDone, setMinLoadingDone] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

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

    // Status-based fallback if generic
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
      paymentId: paymentId
    });

    // Replace State to clean URL query params, keeping current pathname intact
    window.history.replaceState({}, '', pathname);

    // If success, start minimum loading timer
    if (type === 'success') {
      const timer = setTimeout(() => {
        setMinLoadingDone(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Poll user profile to check if Firestore was updated by webhook (only on success path)
  useEffect(() => {
    if (!currentUser || !currentUser.userId) return;
    if (pathType !== 'success') return;

    // Check if plan is upgraded
    const isPlanUpdated = currentUser.plan && currentUser.plan !== 'free';
    if (isPlanUpdated && minLoadingDone) return;

    // Direct background sync
    const interval = setInterval(async () => {
      try {
        console.log("[PaymentReturn Success] Polling Firestore for upgraded plan status...");
        await dbService.syncArtistData(currentUser.userId);
        if (onRefreshProfile) {
          onRefreshProfile();
        }
      } catch (err) {
        console.warn("[PaymentReturn Success] Retrying profile poll: ", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser?.userId, currentUser?.plan, pathType, minLoadingDone]);

  // Handle countdown redirection to dashboard
  useEffect(() => {
    const isPlanUpdated = currentUser && currentUser.plan && currentUser.plan !== 'free';
    if (isPlanUpdated && minLoadingDone && pathType === 'success') {
      if (countdown === null) {
        setCountdown(5); // 5 seconds countdown to auto-navigate
      }
    }
  }, [currentUser?.plan, minLoadingDone, pathType, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      onNavigate('dashboard');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle manual verification for Pending route ("JÁ PAGUEI — VERIFICAR AGORA")
  const handleVerifyPending = async () => {
    if (!currentUser || !currentUser.userId) return;
    
    setChecking(true);
    setManualStatusMessage("");

    try {
      // 1. Consult Firestore to get latest state synced
      await dbService.syncArtistData(currentUser.userId);
      if (onRefreshProfile) {
        onRefreshProfile();
      }

      // 2. Read refreshed data from local database state
      const refreshedUser = dbService.getCurrentUser();
      
      if (refreshedUser && refreshedUser.plan && refreshedUser.plan !== 'free') {
        // Updated! Redirect directly to dashboard
        onNavigate('dashboard');
      } else {
        // Still pending
        setManualStatusMessage("A confirmação ainda não chegou. Aguarde alguns instantes e tente novamente.");
      }
    } catch (err) {
      console.error("Error verifying payment manually:", err);
      setManualStatusMessage("Erro ao consultar informações com o servidor. Tente novamente.");
    } finally {
      setChecking(false);
    }
  };

  const handleGoToDashboard = () => {
    onNavigate('dashboard');
  };

  const isSuccessActive = currentUser && currentUser.plan && currentUser.plan !== 'free';

  return (
    <div className="min-h-screen bg-[#06080d] flex items-center justify-center px-4 relative overflow-hidden select-none font-sans">
      
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-orange-650/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-yellow-600/5 rounded-full blur-[90px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/40 border border-slate-850/60 p-8 md:p-10 rounded-3xl text-center space-y-6 md:space-y-8 relative z-10 backdrop-blur-md">
        
        {/* Animated Badge Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-950/40 to-yellow-950/40 border border-orange-500/10 text-orange-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest leading-none">
          <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" /> Status de Pagamento
        </div>

        {/* 1. SUCCESS STATE */}
        {pathType === 'success' && (
          <div className="space-y-6">
            {(!isSuccessActive || !minLoadingDone) ? (
              // Minimum Loading Indicator
              <div className="space-y-6">
                <div className="w-18 h-18 bg-orange-950/20 border border-orange-500/30 rounded-full flex items-center justify-center mx-auto text-orange-400">
                  <div className="w-10 h-10 border-4 border-t-orange-500 border-orange-500/10 rounded-full animate-spin"></div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-heading font-black text-white tracking-tight">
                    Pagamento aprovado!
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Recebemos a confirmação do Mercado Pago. Seu plano está sendo atualizado automaticamente.
                  </p>
                </div>
              </div>
            ) : (
              // Active Plan Confirmed State
              <div className="space-y-6 animate-fade-in">
                <div className="w-18 h-18 bg-emerald-950/50 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/30 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 fill-emerald-950" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-heading font-black text-emerald-400 tracking-tight">
                    Seu plano já está ativo.
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Parabéns! Sua assinatura foi confirmada pelos servidores do Mercado Pago. Todo o seu limite e funcionalidades premium já estão totalmente liberados em sua conta.
                  </p>
                </div>

                {currentUser && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 inline-block text-left text-xs space-y-1.5 font-mono text-slate-400 w-full">
                    <p><strong className="text-slate-500 uppercase font-bold">Assinante:</strong> {currentUser.name || currentUser.email}</p>
                    <p><strong className="text-slate-500 uppercase font-bold">Plano Ativo:</strong> <span className="text-emerald-400 font-bold uppercase">{currentUser.plan || 'PRO'}</span></p>
                    <p><strong className="text-slate-500 uppercase font-bold">Status da Conta:</strong> <span className="text-emerald-400 font-bold">ATIVO ⭐</span></p>
                  </div>
                )}

                {countdown !== null && (
                  <p className="text-xs text-slate-400 font-mono italic">
                    Retornando ao painel automaticamente em {countdown} segundos...
                  </p>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-450 hover:brightness-110 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                id="btn-sucesso-painel"
              >
                IR PARA O MEU PAINEL <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. PENDING STATE */}
        {pathType === 'pending' && (
          <div className="space-y-6">
            <div className="w-18 h-18 bg-amber-955/40 border border-yellow-550/30 rounded-full flex items-center justify-center mx-auto text-yellow-400 animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-heading font-bold text-yellow-400 tracking-tight leading-snug">
                Estamos aguardando a confirmação do pagamento
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Pagamentos por Pix normalmente são confirmados rapidamente. Assim que o Mercado Pago aprovar, seu plano será liberado automaticamente.
              </p>
            </div>

            {checking && (
              <div className="py-2 flex items-center justify-center gap-2 text-xs text-orange-400 font-mono">
                <div className="w-3 h-3 border border-t-orange-400 border-transparent rounded-full animate-spin"></div>
                Consultando transações do Mercado Pago...
              </div>
            )}

            {manualStatusMessage && (
              <p className="text-xs text-yellow-400 font-mono leading-snug bg-yellow-950/15 p-3 rounded-xl border border-yellow-500/20">
                {manualStatusMessage}
              </p>
            )}

            <div className="pt-2 flex flex-col space-y-3">
              <button
                onClick={handleVerifyPending}
                disabled={checking}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-yellow-500 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                id="btn-pendente-verificar"
              >
                <RotateCcw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} /> JÁ PAGUEI — VERIFICAR AGORA
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-70 text-slate-300 border border-slate-700/50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                id="btn-pendente-painel"
              >
                VOLTAR AO MEU PAINEL
              </button>
            </div>
          </div>
        )}

        {/* 3. ERROR STATE */}
        {pathType === 'error' && (
          <div className="space-y-6">
            <div className="w-18 h-18 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-heading font-bold text-red-400 tracking-tight">
                O pagamento não foi concluído
              </h3>
              <p className="text-xs text-slate-350 leading-relaxed max-w-sm mx-auto">
                Nenhuma cobrança aprovada foi identificada. Você pode tentar novamente ou voltar ao painel.
              </p>
            </div>

            <div className="pt-2 flex flex-col space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                id="btn-erro-tentar"
              >
                TENTAR NOVAMENTE
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-70 text-slate-300 border border-slate-750 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                id="btn-erro-painel"
              >
                VOLTAR AO PAINEL
              </button>
            </div>
          </div>
        )}

        {/* 4. GENERIC / FALLBACK STATE */}
        {pathType === 'generic' && (
          <div className="space-y-6">
            <div className="w-18 h-18 bg-slate-950/40 border border-slate-755 rounded-full flex items-center justify-center mx-auto text-slate-400 rotate-180 animate-pulse">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-heading font-bold text-slate-200 tracking-tight">
                Verificação de Assinatura
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Verificando transações registradas para liberar os limites e funções da sua conta no SomDrive.
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
                onClick={handleVerifyPending}
                disabled={checking}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                id="btn-generic-verificar"
              >
                VERIFICAR STATUS DA ASSINATURA
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-70 transition text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                id="btn-generic-painel"
              >
                VOLTAR AO PAINEL
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
