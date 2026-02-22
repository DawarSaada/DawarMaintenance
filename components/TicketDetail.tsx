
import React, { useState, useEffect, useCallback } from 'https://esm.sh/react@19.0.0';
import { Ticket, User, TicketStatus, UserRole, Priority, Language } from '../types.ts';
import { STATUS_MAP } from '../constants.ts';
import { getAiMaintenanceInsights, MaintenanceInsights } from '../services/geminiService.ts';

interface TicketDetailProps {
  ticket: Ticket;
  user: User;
  branches: {name_en: string, name_ar: string}[];
  onUpdateStatus: (id: string, status: TicketStatus, comment?: string) => void;
  onBack: () => void;
  t: any;
  lang: Language;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, user, branches, onUpdateStatus, onBack, t, lang }) => {
  const [comment, setComment] = useState('');
  const [aiData, setAiData] = useState<MaintenanceInsights | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const localizedBranch = branches.find(b => b.name_en === ticket.branch);
  const branchName = lang === 'ar' ? localizedBranch?.name_ar || ticket.branch : localizedBranch?.name_en || ticket.branch;

  const fetchAiData = useCallback(async () => {
    setLoadingAi(true);
    setAiError(false);
    const result = await getAiMaintenanceInsights(ticket.title, ticket.description);
    if (result) {
      setAiData(result);
    } else {
      setAiError(true);
    }
    setLoadingAi(false);
  }, [ticket.title, ticket.description]);

  useEffect(() => {
    fetchAiData();
  }, [fetchAiData]);

  const handleAction = (status: TicketStatus) => {
    onUpdateStatus(ticket.id, status, comment);
    setComment('');
  };

  const isOM = user.role === UserRole.OPERATION_MANAGER;
  const isCEO = user.role === UserRole.CEO;
  const isBM = user.role === UserRole.BRANCH_MANAGER;

  const steps = [
    { label: t.step1, statuses: [TicketStatus.PENDING_OM_REVIEW] },
    { label: t.step2, statuses: [TicketStatus.PENDING_CEO_APPROVAL] },
    { label: t.step3, statuses: [TicketStatus.APPROVED_PENDING_RESOLUTION, TicketStatus.IN_PROGRESS] },
    { label: t.step4, statuses: [TicketStatus.RESOLVED_PENDING_VERIFICATION] },
    { label: t.step5, statuses: [TicketStatus.CLOSED] }
  ];

  const getCurrentStepIndex = () => {
    if (ticket.status === TicketStatus.CLOSED) return 5;
    if (ticket.status === TicketStatus.RESOLVED_PENDING_VERIFICATION) return 4;
    if (ticket.status === TicketStatus.APPROVED_PENDING_RESOLUTION || ticket.status === TicketStatus.IN_PROGRESS) return 3;
    if (ticket.status === TicketStatus.PENDING_CEO_APPROVAL) return 2;
    return 1;
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn space-y-6 relative pb-12">
      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 cursor-pointer animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Full view" className="max-w-full max-h-full rounded-xl shadow-2xl transition-transform" />
          <button className="absolute top-8 right-8 text-white text-3xl font-black p-4">✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 font-semibold hover:text-orange-600 transition-colors"
        >
          <span className={`bg-orange-600 text-white rounded-md w-6 h-6 flex items-center justify-center text-xs ${lang === 'ar' ? 'ml-2' : 'mr-2'}`}>
            {lang === 'ar' ? '⬅' : '⬅'}
          </span>
          {t.backToDashboard}
        </button>
        <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-mono">
          {t.id}: {ticket.id}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">{ticket.title}</h1>
                  <div className="flex flex-wrap gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center"><span className={`${lang === 'ar' ? 'ml-2' : 'mr-2'}`}>🏪</span> {branchName}</span>
                    <span className="flex items-center"><span className={`${lang === 'ar' ? 'ml-2' : 'mr-2'}`}>⚖️</span> {ticket.priority}</span>
                    <span className="flex items-center"><span className={`${lang === 'ar' ? 'ml-2' : 'mr-2'}`}>👤</span> {ticket.createdBy}</span>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_MAP[ticket.status].color}`}>
                  {STATUS_MAP[ticket.status].label}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{ticket.description}</p>

              {/* Media Gallery */}
              {ticket.media && ticket.media.length > 0 && (
                <div className="mb-10">
                  <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-4">{t.evidence}</h4>
                  <div className="flex flex-wrap gap-3">
                    {ticket.media.map((url, i) => (
                      <div 
                        key={i} 
                        className="w-24 h-24 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-orange-500 transition-all shadow-sm group active:scale-95"
                        onClick={() => setSelectedImage(url)}
                      >
                        <img src={url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insight Box */}
              <div className="rounded-2xl overflow-hidden shadow-lg mb-10 transition-all border border-slate-800">
                <div className="bg-[#f26722] px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-white text-lg">✨</span>
                    <span className="text-white font-bold text-[10px] uppercase tracking-[0.2em]">{t.assistantInsight}</span>
                  </div>
                  {aiError && (
                    <button 
                      onClick={fetchAiData} 
                      className="text-[9px] bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider transition-colors"
                    >
                      {t.retry}
                    </button>
                  )}
                </div>
                <div className="bg-[#1e1b4b] p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h4 className="text-orange-400 text-[10px] font-black uppercase tracking-widest">{t.impactAnalysis}</h4>
                    <div className="text-white text-sm font-semibold leading-relaxed">
                      {loadingAi ? (
                        <div className="animate-pulse flex space-x-2">
                          <div className="h-4 bg-white/10 rounded w-full"></div>
                        </div>
                      ) : aiError ? (
                        <span className="text-slate-400 italic text-xs">AI Service Busy.</span>
                      ) : (
                        aiData?.analysis || 'Analyzing...'
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-orange-400 text-[10px] font-black uppercase tracking-widest">{t.quickFix}</h4>
                    <div className="space-y-2">
                      {loadingAi ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        </div>
                      ) : (
                        aiData?.tips.map((tip, idx) => (
                          <div key={idx} className="flex items-start text-white text-[11px] font-medium">
                            <span className="text-orange-500 mr-2 ml-2">•</span>
                            <span>{tip}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                <h4 className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 tracking-widest">{t.internalNote}</h4>
                <textarea 
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-sm font-medium transition-all text-slate-900 dark:text-white"
                  placeholder={t.typeNote}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>

                <div className="flex flex-wrap gap-4">
                   {isOM && ticket.status === TicketStatus.PENDING_OM_REVIEW && (
                    <>
                      <button onClick={() => handleAction(TicketStatus.PENDING_CEO_APPROVAL)} className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-orange-700 transition-all">{t.acceptCEO}</button>
                      <button onClick={() => handleAction(TicketStatus.OM_REJECTED)} className="px-8 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-50 transition-all">{t.reject}</button>
                    </>
                  )}
                  {isCEO && ticket.status === TicketStatus.PENDING_CEO_APPROVAL && (
                    <>
                      <button onClick={() => handleAction(TicketStatus.APPROVED_PENDING_RESOLUTION)} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-all">{t.approveOM}</button>
                      <button onClick={() => handleAction(TicketStatus.CEO_REJECTED)} className="px-8 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-50 transition-all">{t.decline}</button>
                    </>
                  )}
                  {isOM && ticket.status === TicketStatus.APPROVED_PENDING_RESOLUTION && (
                    <button onClick={() => handleAction(TicketStatus.RESOLVED_PENDING_VERIFICATION)} className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-orange-700 transition-all">{t.resolvedVerify}</button>
                  )}
                  {isBM && ticket.status === TicketStatus.RESOLVED_PENDING_VERIFICATION && (
                    <>
                      <button onClick={() => handleAction(TicketStatus.CLOSED)} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-all">{t.verifyClose}</button>
                      <button onClick={() => handleAction(TicketStatus.PENDING_OM_REVIEW)} className="px-8 py-3 bg-white text-orange-600 border border-orange-200 rounded-xl font-bold text-sm hover:bg-orange-50 transition-all">{t.reIssue}</button>
                    </>
                  )}
                  {!((isOM && (ticket.status === TicketStatus.PENDING_OM_REVIEW || ticket.status === TicketStatus.APPROVED_PENDING_RESOLUTION)) || (isCEO && ticket.status === TicketStatus.PENDING_CEO_APPROVAL) || (isBM && ticket.status === TicketStatus.RESOLVED_PENDING_VERIFICATION)) && (
                    <div className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 text-xs italic text-center">
                      {t.waitReviewer}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Communication Log */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
            <h3 className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 tracking-widest mb-6">{t.communicationLog}</h3>
            <div className="space-y-6">
               <div className="pl-6 ltr:border-l-2 rtl:pr-6 rtl:border-r-2 border-slate-100 dark:border-slate-800 relative">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">{t.ticketInitiated} {new Date(ticket.createdAt).toLocaleDateString()}</p>
               </div>
               {ticket.comments.map(c => (
                 <div key={c.id} className="pl-6 ltr:border-l-2 rtl:pr-6 rtl:border-r-2 border-slate-100 dark:border-slate-800 relative">
                    <p className="text-[11px] text-slate-500 font-bold mb-1 uppercase tracking-wider">{c.author} ({c.role.replace('_', ' ')}) • {new Date(c.timestamp).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{c.text}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
            <h3 className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 tracking-widest mb-8">{t.trackingHistory}</h3>
            <div className="space-y-8">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                return (
                  <div key={idx} className="flex items-center space-x-4 space-x-reverse">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : isCurrent ? 'bg-orange-600 border-orange-600 text-white shadow-lg scale-110' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300'}`}>
                      {isCompleted ? '✓' : stepNum}
                    </div>
                    <span className={`text-xs font-bold ${isCompleted ? 'text-slate-800 dark:text-slate-200' : isCurrent ? 'text-orange-600' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1e1b4b] rounded-xl p-8">
            <h3 className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-6">{t.workflowPolicy}</h3>
            <div className="space-y-4 text-[11px] leading-relaxed text-slate-400">
              <p>{t.policyInitiation}</p>
              <p>{t.policyApproval}</p>
              <p>{t.policyExecution}</p>
              <p>{t.policyVerification}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
