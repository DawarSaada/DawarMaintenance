
import React, { useState, useRef, useEffect } from 'https://esm.sh/react@19.0.0';
import { Priority, Ticket, User, UserRole, Language } from '../types.ts';

interface TicketFormProps {
  branches: {name_en: string, name_ar: string}[];
  user: User;
  onSubmit: (data: Partial<Ticket>) => void;
  onCancel: () => void;
  t: any;
  lang: Language;
}

const TicketForm: React.FC<TicketFormProps> = ({ branches, user, onSubmit, onCancel, t, lang }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBranchManager = user.role === UserRole.BRANCH_MANAGER;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    branch: isBranchManager ? (user.branch || '') : (branches[0]?.name_en || ''),
    priority: Priority.MEDIUM
  });
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 600; canvas.height = 600;
          canvas.getContext('2d')?.drawImage(img, 0, 0, 600, 600);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    for (const file of Array.from(e.target.files) as File[]) {
      if (media.length < 5) {
        const res = await compressImage(file);
        setMedia(prev => [...prev, res]);
      }
    }
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, media });
  };

  const inputClasses = "w-full px-5 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-orange-500 outline-none text-slate-900 dark:text-white transition-all";

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex items-center space-x-3 space-x-reverse mb-4">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">⬅️</button>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t.createTicket}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-10 space-y-8">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mx-1">{t.issueTitle}</label>
            <input required type="text" className={inputClasses} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mx-1">{t.branchLocation}</label>
              <select className={inputClasses} value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} disabled={isBranchManager}>
                {branches.map(b => (
                  <option key={b.name_en} value={b.name_en}>
                    {lang === 'ar' ? b.name_ar : b.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mx-1">{t.priorityLevel}</label>
              <select className={inputClasses} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})}>
                <option value={Priority.LOW}>Low</option>
                <option value={Priority.MEDIUM}>Medium</option>
                <option value={Priority.HIGH}>High</option>
                <option value={Priority.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mx-1">{t.description}</label>
            <textarea required rows={4} className={inputClasses} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mx-1">{t.attachMedia}</label>
            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              {media.map((m, i) => (
                <div key={i} className="w-24 h-24 rounded-xl overflow-hidden shadow relative group">
                  <img src={m} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setMedia(media.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                </div>
              ))}
              {media.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-500 transition-colors">
                  {uploading ? '...' : '+'}
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 px-10 py-8 flex justify-between items-center border-t border-slate-100 dark:border-slate-700">
          <button type="button" onClick={onCancel} className="font-bold text-slate-400 hover:text-slate-600 transition-colors">{t.cancel}</button>
          <button type="submit" disabled={uploading} className="px-10 py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-700 transition-all">
            {uploading ? t.processing : t.save}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;
