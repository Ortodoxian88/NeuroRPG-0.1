import React, { useState } from 'react';
import { Bug, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  roomId: string | null;
}

export default function ReportModal({ isOpen, onClose, userEmail, roomId }: ReportModalProps) {
  const [reportType, setReportType] = useState<'bug' | 'suggestion' | 'typo'>('bug');
  const [reportMessage, setReportMessage] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleSendReport = async () => {
    if (!reportMessage.trim()) return;
    setIsReporting(true);
    try {
      const reportUrl = '/api/report';
      const response = await fetch(reportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          message: reportMessage,
          userEmail: userEmail || 'anonymous',
          roomId,
          version: '0.2.9'
        })
      });
      if (response.ok) {
        setReportSuccess(true);
        setReportMessage('');
        setTimeout(() => {
          setReportSuccess(false);
          onClose();
        }, 3000);
      }
    } catch (e) {
      console.error("Report failed", e);
    } finally {
      setIsReporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {reportSuccess ? (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Спасибо за вклад!</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Твой репорт уже летит к разработчику на крыльях цифрового дракона. Вместе мы сделаем NeuroRPG легендарной.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bug size={20} className="text-orange-500" />
                Обратная связь
              </h3>
              <button onClick={onClose} className="text-neutral-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2">
              {(['bug', 'suggestion', 'typo'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setReportType(t)}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border transition-all",
                    reportType === t ? "bg-orange-600 border-orange-500 text-white" : "bg-neutral-800 border-neutral-700 text-neutral-500"
                  )}
                >
                  {t === 'bug' ? 'Баг' : t === 'suggestion' ? 'Идея' : 'Текст'}
                </button>
              ))}
            </div>

            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              placeholder="Опиши проблему или идею..."
              className="w-full h-32 bg-black border border-neutral-800 rounded-2xl p-4 text-base text-white outline-none focus:border-orange-500 transition-colors resize-none"
            />

            <button
              onClick={handleSendReport}
              disabled={isReporting || !reportMessage.trim()}
              className="w-full py-4 bg-white text-black font-bold text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all disabled:opacity-50"
            >
              {isReporting ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              Отправить отчет
            </button>
          </>
        )}
      </div>
    </div>
  );
}
