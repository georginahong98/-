
import React, { useState, useEffect } from 'react';
import { Step, BrandProfile, CampaignConfig, GeneratedContent, ToneOptions, AIStrategies, MaterialSelection, AIStrategyItem } from './types';
import { analyzeBrand, generateCopy, generatePoster, generateStrategies, generateCampaignThemes } from './geminiService';

// --- Sub-components ---

const Sidebar = ({ currentStep, onBack }: { currentStep: Step; onBack: () => void }) => {
  const steps = [
    { id: Step.UPLOAD, label: '素材上传', icon: '📁' },
    { id: Step.ANALYSIS_REVIEW, label: '调性分析', icon: '✨' },
    { id: Step.CAMPAIGN_CONFIG, label: '活动配置', icon: '📝' },
    { id: Step.FINAL_PREVIEW, label: '物料生成', icon: '🖼️' },
  ];

  if (currentStep === Step.INTRO) return null;

  return (
    <aside className="w-64 hidden lg:flex flex-col p-6 h-screen sticky top-0 border-r border-slate-200 bg-white z-20">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">B</div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">BrandAI</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = Object.values(Step).indexOf(currentStep) > Object.values(Step).indexOf(step.id);
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
              }`}
            >
              <span className="text-body-main">{step.icon}</span>
              <span className="text-body-main">{step.label}</span>
              {isCompleted && <span className="ml-auto text-green-500">✓</span>}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <button
          onClick={onBack}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all font-semibold"
        >
          <span className="text-body-main">↩</span>
          <span className="text-body-main">返回上一步</span>
        </button>
        
        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-lg">🦁</div>
           <div>
             <p className="text-[14px] font-bold text-slate-800">运营专家</p>
             <p className="text-[12px] text-slate-400">在线协助中</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

// --- Strategy Edit Modal Component ---
const StrategyEditModal = ({
  isOpen,
  onClose,
  title,
  strategy,
  onStrategyChange,
  onRegenerate
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  strategy: AIStrategyItem | undefined;
  onStrategyChange: (field: 'features' | 'tactics', value: any) => void;
  onRegenerate: () => void;
}) => {
  if (!isOpen || !strategy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-xl transition-colors">✕</button>
        
        <div className="mb-6 flex-shrink-0">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🧠</span> 调整生成策略
            </h3>
            <p className="text-sm text-slate-500 mt-1">针对 <span className="font-bold text-blue-600">{title}</span> 的 AI 思考逻辑</p>
        </div>
        
        <div className="space-y-6 overflow-y-auto pr-2 flex-1">
           <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">场景特征 (Context)</label>
             <textarea 
                className="w-full bg-transparent border-none text-slate-700 text-body-main font-medium resize-none focus:ring-0 p-0"
                rows={3}
                value={strategy.features}
                onChange={(e) => onStrategyChange('features', e.target.value)}
             />
           </div>

           <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">AI 设计策略 (Tactics)</label>
             <ul className="space-y-3">
               {strategy.tactics.map((tactic, idx) => (
                 <li key={idx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                   <textarea 
                     className="flex-1 bg-transparent border-none text-slate-700 text-body-main leading-snug focus:ring-0 p-0 resize-none"
                     rows={2}
                     value={tactic}
                     onChange={(e) => {
                       const newTactics = [...strategy.tactics];
                       newTactics[idx] = e.target.value;
                       onStrategyChange('tactics', newTactics);
                     }}
                   />
                 </li>
               ))}
             </ul>
           </div>
        </div>

        <div className="mt-8 flex gap-4 flex-shrink-0">
           <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">取消</button>
           <button onClick={onRegenerate} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all">确认并重新生成</button>
        </div>
      </div>
    </div>
  );
};

// --- Compact Style Tuner Component ---
const CompactStyleTuner = ({ options, onChange, onRegenerate, isRegenerating }: { 
  options: ToneOptions, 
  onChange: (newOptions: ToneOptions) => void,
  onRegenerate: () => void,
  isRegenerating: boolean
}) => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-3 px-6 shadow-lg flex flex-wrap items-center gap-4 lg:gap-8 transition-all shrink-0">
      <div className="flex items-center gap-3 mr-2">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg">🎚️</div>
        <div className="hidden md:block">
          <h3 className="text-sm font-bold">AI 调音台</h3>
        </div>
      </div>
      
      <div className="h-8 w-px bg-white/10 hidden md:block"></div>

      {/* Selectors Row */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar flex-1">
        {/* Tone */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-400 font-bold uppercase">语气</span>
            <select 
                value={options.tone}
                onChange={(e) => onChange({...options, tone: e.target.value as any})}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
                <option value="professional">专业严谨</option>
                <option value="friendly">亲切活泼</option>
                <option value="humorous">幽默风趣</option>
                <option value="enthusiastic">热情洋溢</option>
                <option value="elegant">优雅知性</option>
            </select>
        </div>

        {/* Style */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-400 font-bold uppercase">风格</span>
            <select 
                value={options.visualStyle}
                onChange={(e) => onChange({...options, visualStyle: e.target.value as any})}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
                <option value="minimalist">极简高级</option>
                <option value="vibrant">活力波普</option>
                <option value="luxury">黑金奢华</option>
                <option value="retro">复古怀旧</option>
                <option value="natural">自然清新</option>
                <option value="custom">自定义...</option>
            </select>
        </div>

        {/* Length */}
        <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-400 font-bold uppercase">篇幅</span>
            <select 
                value={options.copyLength}
                onChange={(e) => onChange({...options, copyLength: e.target.value as any})}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
                <option value="concise">精简</option>
                <option value="balanced">适中</option>
                <option value="detailed">详尽</option>
                <option value="bullet">清单</option>
            </select>
        </div>
      </div>

      <div className="h-8 w-px bg-white/10 hidden md:block"></div>

      <button 
        onClick={onRegenerate}
        disabled={isRegenerating}
        className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shrink-0 ${
          isRegenerating ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
        }`}
      >
        {isRegenerating ? (
          <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> 优化中</>
        ) : (
          <>↻ 全局重绘</>
        )}
      </button>
    </div>
  );
};

// --- Helper Component for Image Regenerate ---
const ImageCard = ({ 
  src, 
  label, 
  extraLabel, 
  onRegenerate, 
  onClick,
  isRegenerating,
  aspectRatioClass = "aspect-[3/4]" 
}: { 
  src: string; 
  label: string; 
  extraLabel?: React.ReactNode; 
  onRegenerate: () => void;
  onClick?: () => void;
  isRegenerating: boolean;
  aspectRatioClass?: string;
}) => (
  <div 
    className="cl-card p-3 group relative cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
    onClick={onClick}
  >
    <div className={`relative w-full overflow-hidden rounded-[16px] bg-slate-100 flex-1 ${aspectRatioClass}`}>
       {isRegenerating ? (
         <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
           <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
           <span className="text-xs font-bold text-blue-600">重绘中...</span>
         </div>
       ) : (
         <img src={src} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
       )}
       
       <div className="absolute top-3 left-3 bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 z-10 pointer-events-none shadow-sm">
         {label}
       </div>
       
       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 text-xs font-bold text-slate-700 flex items-center gap-2">
            <span>⚡ 调整策略</span>
          </div>
       </div>

       {extraLabel}
    </div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.INTRO);
  const [isProcessing, setIsProcessing] = useState(false);
  const [regeneratingItems, setRegeneratingItems] = useState<Record<string, boolean>>({});
  
  // New state for strategy modal
  const [activeStrategyKey, setActiveStrategyKey] = useState<keyof AIStrategies | null>(null);
  
  const [brandName, setBrandName] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [uploadImages, setUploadImages] = useState<string[]>([]);
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  // Theme suggestions
  const [themeSuggestions, setThemeSuggestions] = useState<string[]>([]);
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [showThemeSuggestions, setShowThemeSuggestions] = useState(false);
  
  // Default Tone Options
  const [toneOptions, setToneOptions] = useState<ToneOptions>({
    tone: 'friendly',
    visualStyle: 'minimalist',
    copyLength: 'balanced'
  });
  
  const [campaign, setCampaign] = useState<CampaignConfig>({ 
    activityType: 'acquisition',
    activityName: '',
    campaignTheme: '',
    incentive: '', 
    incentiveImage: '',
    wecomQrCode: '',
    startTime: '',
    endTime: '',
    rules: '',
    promotionDetails: '',
    materials: {
        wecomWelcome: true,
        wecomNotification: false,
        groupWelcome: true,
        groupNotification: false,
        momentsCopy: true,
        tableTent: true,
        landingPage: false
    },
    materialDimensions: {
        tableTent: 'A5',
        momentsPoster: '9:16',
        landingPage: '9:16'
    }
  });
  
  const [results, setResults] = useState<GeneratedContent | null>(null);

  // Effect to update default materials when activity type changes
  useEffect(() => {
    if (campaign.activityType === 'acquisition') {
        setCampaign(prev => ({
            ...prev,
            materials: {
                wecomWelcome: true,
                wecomNotification: false,
                groupWelcome: true,
                groupNotification: false,
                momentsCopy: true,
                tableTent: true,
                landingPage: false
            }
        }));
    } else {
        setCampaign(prev => ({
            ...prev,
            materials: {
                wecomWelcome: false,
                wecomNotification: true,
                groupWelcome: false,
                groupNotification: true,
                momentsCopy: true,
                tableTent: true,
                landingPage: false
            }
        }));
    }
  }, [campaign.activityType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'visual' | 'menu' | 'incentive' | 'qrcode') => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (target === 'visual') setUploadImages(prev => [...prev, dataUrl]);
        else if (target === 'menu') setMenuImages(prev => [...prev, dataUrl]);
        else if (target === 'incentive') setCampaign(prev => ({ ...prev, incentiveImage: dataUrl }));
        else if (target === 'qrcode') setCampaign(prev => ({ ...prev, wecomQrCode: dataUrl }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStartAnalysis = async () => {
    if (!brandName.trim()) return alert("请输入品牌名称。");
    setIsProcessing(true);
    try {
      const profile = await analyzeBrand({ brandName, text: uploadText, images: uploadImages, menuImages });
      setBrandProfile(profile);
      setCurrentStep(Step.ANALYSIS_REVIEW);
    } catch (err) { alert("分析失败。"); } finally { setIsProcessing(false); }
  };

  const handleGenerateThemes = async () => {
    if (!brandProfile) return;
    setIsGeneratingThemes(true);
    setShowThemeSuggestions(true);
    try {
        const themes = await generateCampaignThemes(brandProfile);
        setThemeSuggestions(themes);
    } catch (e) {
        console.error(e);
        setThemeSuggestions(["夏日新品季", "周末狂欢", "会员感谢日"]); // Fallback
    } finally {
        setIsGeneratingThemes(false);
    }
  };

  const handleApplyTheme = (theme: string) => {
    setCampaign({...campaign, campaignTheme: theme});
    setShowThemeSuggestions(false);
  };

  const handleStartGeneration = async () => {
    if (!brandProfile) return;
    setIsProcessing(true);
    try {
      const { materials, materialDimensions } = campaign;
      const strategies = await generateStrategies(brandProfile, campaign);

      const promiseMap: any = {};
      promiseMap.copy = generateCopy(brandProfile, campaign, toneOptions);

      if (materials.tableTent) {
        promiseMap.tableTent = generatePoster(brandProfile, campaign, materialDimensions.tableTent, toneOptions, JSON.stringify(strategies.tableTent));
      }
      if (materials.momentsCopy) {
        // Assume visuals needed if copy needed
        promiseMap.momentsPoster = generatePoster(brandProfile, campaign, materialDimensions.momentsPoster, toneOptions, JSON.stringify(strategies.moments));
      }
      if (materials.landingPage) {
        promiseMap.landingPage = generatePoster(brandProfile, campaign, materialDimensions.landingPage, toneOptions, JSON.stringify(strategies.landingPage));
      }

      // Wait for all promises
      const keys = Object.keys(promiseMap);
      const values = await Promise.all(Object.values(promiseMap));
      const resultMap: any = {};
      keys.forEach((key, index) => {
        resultMap[key] = values[index];
      });

      setResults({ 
          strategies, 
          copy: resultMap.copy, 
          posters: {
              tableTent: resultMap.tableTent,
              momentsPoster: resultMap.momentsPoster,
              landingPage: resultMap.landingPage,
              publicPlatform: undefined 
          } 
      });
      
      setCurrentStep(Step.FINAL_PREVIEW);
    } catch (err) { console.error(err); alert("生成失败。"); } finally { setIsProcessing(false); }
  };

  const handleRegenerate = async () => {
      await handleStartGeneration();
  };

  const handleSingleRegenerate = async (target: 'tableTent' | 'publicPlatform' | 'momentsPoster' | 'copy' | 'landingPage') => {
    if (!brandProfile || !results) return;
    
    setRegeneratingItems(prev => ({ ...prev, [target]: true }));
    
    try {
      if (target === 'copy') {
        const newCopy = await generateCopy(brandProfile, campaign, toneOptions);
        setResults(prev => prev ? ({ ...prev, copy: newCopy }) : null);
      } else {
        const dimensionMap: Record<string, string> = {
          'tableTent': campaign.materialDimensions.tableTent,
          'momentsPoster': campaign.materialDimensions.momentsPoster,
          'landingPage': campaign.materialDimensions.landingPage
        };
        const strategyMap: Record<string, keyof AIStrategies> = {
            'tableTent': 'tableTent',
            'momentsPoster': 'moments',
            'landingPage': 'landingPage'
        };
        
        const strategyKey = strategyMap[target];
        // Only regenerate if strategy exists
        if (!results.strategies[strategyKey]) {
            throw new Error("No strategy for this item");
        }
        
        const strategyContext = JSON.stringify(results.strategies[strategyKey]);

        const newPoster = await generatePoster(
            brandProfile, 
            campaign, 
            dimensionMap[target] || '3:4', 
            toneOptions, 
            strategyContext
        );
        
        setResults(prev => prev ? ({ 
          ...prev, 
          posters: { ...prev.posters, [target]: newPoster } 
        }) : null);
      }
    } catch (err) {
      alert("重新生成失败，请稍后重试");
    } finally {
      setRegeneratingItems(prev => ({ ...prev, [target]: false }));
    }
  };

  const handleStrategyChange = (key: keyof AIStrategies, field: 'features' | 'tactics', value: any) => {
    if (!results) return;
    setResults(prev => {
        if (!prev) return null;
        return {
            ...prev,
            strategies: {
                ...prev.strategies,
                [key]: {
                    ...prev.strategies[key]!,
                    [field]: value
                }
            }
        };
    });
  };

  const handleStrategyRegenerateFromModal = () => {
    if (!activeStrategyKey) return;
    
    // Map strategy key back to poster target key
    const strategyToTargetMap: Record<string, 'tableTent' | 'momentsPoster' | 'landingPage'> = {
        'tableTent': 'tableTent',
        'moments': 'momentsPoster',
        'landingPage': 'landingPage'
    };
    
    const target = strategyToTargetMap[activeStrategyKey];
    if (target) {
        handleSingleRegenerate(target);
        setActiveStrategyKey(null); // Close modal
    }
  };

  const handleBack = () => {
    if (currentStep === Step.UPLOAD) setCurrentStep(Step.INTRO);
    else if (currentStep === Step.ANALYSIS_REVIEW) setCurrentStep(Step.UPLOAD);
    else if (currentStep === Step.CAMPAIGN_CONFIG) setCurrentStep(Step.ANALYSIS_REVIEW);
    else if (currentStep === Step.FINAL_PREVIEW) setCurrentStep(Step.CAMPAIGN_CONFIG);
  };

  const handleMaterialToggle = (key: keyof MaterialSelection) => {
    setCampaign(prev => ({
        ...prev,
        materials: {
            ...prev.materials,
            [key]: !prev.materials[key]
        }
    }));
  };

  const handleDimensionChange = (key: keyof CampaignConfig['materialDimensions'], value: string) => {
      setCampaign(prev => ({
          ...prev,
          materialDimensions: {
              ...prev.materialDimensions,
              [key]: value
          }
      }));
  };

  return (
    <div className="h-screen flex bg-[#F8FAFC] overflow-hidden">
      <Sidebar currentStep={currentStep} onBack={handleBack} />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header for Mobile or Intro */}
        {currentStep === Step.INTRO && (
          <header className="p-8 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">B</div>
               <h1 className="text-xl font-bold text-slate-800">BrandAI</h1>
             </div>
             <button className="cl-btn-secondary py-2 px-6 text-sm">联系客服</button>
          </header>
        )}

        <div className={`flex-1 flex flex-col min-h-0 ${currentStep === Step.INTRO ? 'p-6 md:p-10 items-center justify-center overflow-y-auto' : 'p-4 md:p-6'}`}>
          {isProcessing && (
            <div className="fixed inset-0 bg-white/40 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-600 text-guide-title">
                {currentStep === Step.FINAL_PREVIEW ? '正在优化并重新生成...' : '正在构建您的品牌私域资产...'}
              </p>
            </div>
          )}

          {currentStep === Step.INTRO && (
            <div className="max-w-4xl w-full text-center space-y-12 animate-fadeIn">
              <div className="space-y-6">
                <h2 className="text-page-title text-slate-900 leading-tight">
                  从深度研究到 <span className="text-blue-600">精美交付。</span>
                </h2>
                <p className="text-guide-title text-slate-500 max-w-2xl mx-auto">
                  助力品牌快速分析调性并生成高质量拉新物料，让运营更直观高效。
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="cl-card p-8 bg-blue-50/50 border-blue-100">
                  <span className="text-3xl">✨</span>
                  <h3 className="mt-4 text-guide-title text-slate-800">智能分析</h3>
                  <p className="text-body-main text-slate-500 mt-2">基于联网搜索与视觉识别</p>
                </div>
                <div className="cl-card p-8 bg-yellow-50/50 border-yellow-100">
                  <span className="text-3xl">📝</span>
                  <h3 className="mt-4 text-guide-title text-slate-800">文案生成</h3>
                  <p className="text-body-main text-slate-500 mt-2">适配多渠道私域话术</p>
                </div>
                <div className="cl-card p-8 bg-purple-50/50 border-purple-100">
                  <span className="text-3xl">🖼️</span>
                  <h3 className="mt-4 text-guide-title text-slate-800">物料产出</h3>
                  <p className="text-body-main text-slate-500 mt-2">高清海报与门店桌卡</p>
                </div>
              </div>

              <button 
                onClick={() => setCurrentStep(Step.UPLOAD)}
                className="cl-btn-primary text-guide-title px-12 py-5 shadow-xl shadow-blue-200"
              >
                立刻开始
              </button>
            </div>
          )}

          {(currentStep === Step.UPLOAD || currentStep === Step.ANALYSIS_REVIEW || currentStep === Step.CAMPAIGN_CONFIG) && (
             <div className="w-full h-full overflow-y-auto pr-2">
                {/* Content wrapper for scrolling steps */}
                <div className="max-w-6xl mx-auto pb-10">
                    {currentStep === Step.UPLOAD && (
                        <div className="space-y-8 animate-fadeIn">
                        <div className="bg-yellow-400 rounded-[32px] p-10 flex flex-col md:flex-row justify-between items-center gap-8 overflow-hidden relative">
                            <div className="relative z-10 space-y-2">
                            <h2 className="text-page-title text-slate-900">Hi 运营专家! 👋</h2>
                            <p className="text-guide-title text-slate-800 font-medium opacity-80">准备好定义您的品牌智能核心了吗？</p>
                            <div className="pt-4 max-w-sm">
                                <input 
                                type="text" 
                                placeholder="输入品牌名称 (如: Manner Coffee)"
                                className="w-full cl-input border-none shadow-sm text-guide-title font-semibold"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                />
                            </div>
                            </div>
                            <div className="hidden md:block relative z-10 bg-white/20 p-6 rounded-[24px] backdrop-blur-sm">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">☕</div>
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">📁</div>
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">🖼️</div>
                            </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="cl-card p-8 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                <h3 className="text-body-bold text-slate-800 uppercase tracking-widest">品牌调性简述</h3>
                            </div>
                            <textarea 
                                className="w-full h-64 cl-input resize-none text-body-main"
                                placeholder="描述您的品牌性格、核心价值..."
                                value={uploadText}
                                onChange={(e) => setUploadText(e.target.value)}
                            />
                            </div>

                            <div className="cl-card p-8 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                <h3 className="text-body-bold text-slate-800 uppercase tracking-widest">视觉资产 (KV/Logos)</h3>
                            </div>
                            <div className="h-64 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center relative hover:bg-slate-50 transition-colors group">
                                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'visual')} />
                                <div className="text-center space-y-2">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg group-hover:scale-110 transition-transform">+</div>
                                <p className="text-body-bold text-slate-500">上传品牌图</p>
                                </div>
                            </div>
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {uploadImages.map((img, i) => (
                                <img key={i} src={img} className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-sm" />
                                ))}
                            </div>
                            </div>

                            <div className="cl-card p-8 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <h3 className="text-body-bold text-slate-800 uppercase tracking-widest">门店菜单 (AI 分析)</h3>
                            </div>
                            <div className="h-64 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center relative hover:bg-slate-50 transition-colors group">
                                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'menu')} />
                                <div className="text-center space-y-2">
                                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg group-hover:scale-110 transition-transform">≡</div>
                                <p className="text-body-bold text-slate-500">上传菜单</p>
                                </div>
                            </div>
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {menuImages.map((img, i) => (
                                <img key={i} src={img} className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-sm" />
                                ))}
                            </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button 
                            onClick={handleStartAnalysis}
                            className="cl-btn-primary px-16 py-4 shadow-lg disabled:opacity-50 text-guide-title"
                            disabled={!brandName.trim()}
                            >
                            开始深度分析 →
                            </button>
                        </div>
                        </div>
                    )}

                    {currentStep === Step.ANALYSIS_REVIEW && brandProfile && (
                        <div className="space-y-12 animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-page-title text-slate-900">品牌调性分析</h2>
                                <p className="text-guide-title text-slate-500 font-medium mt-3">AI 已为您生成深度洞察，点击即可编辑优化。</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="cl-chip cl-chip-active text-body-main">自动分析中</div>
                                <div className="cl-chip cl-chip-inactive text-body-main">置信度 92%</div>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-10">
                            {[
                            { label: "私域人设与品牌性格", value: brandProfile.persona, field: 'persona', color: 'border-blue-300' },
                            { label: "文案调性与话术风格", value: brandProfile.toneOfVoice, field: 'toneOfVoice', color: 'border-yellow-300' },
                            { label: "视觉策略与审美指南", value: brandProfile.visualStyle, field: 'visualStyle', color: 'border-green-300' },
                            { label: "核心受众与行为洞察", value: brandProfile.targetAudience, field: 'targetAudience', color: 'border-purple-300' }
                            ].map((item, idx) => (
                            <div key={idx} className={`cl-card p-12 border-t-[14px] ${item.color} space-y-8 transition-all hover:shadow-2xl`}>
                                <div className="flex justify-between items-center border-b-2 border-slate-50 pb-6">
                                    <h4 className="text-module-title text-slate-900">{item.label}</h4>
                                    <span className="text-body-main text-slate-400 font-bold">✎ 编辑</span>
                                </div>
                                <textarea 
                                    className="w-full bg-transparent border-none outline-none text-slate-700 text-body-main leading-relaxed h-56 resize-none font-medium placeholder:text-slate-300"
                                    value={item.value}
                                    onChange={(e) => setBrandProfile({...brandProfile, [item.field as keyof BrandProfile]: e.target.value})}
                                />
                            </div>
                            ))}
                        </div>

                        <div className="cl-card p-12 bg-blue-600 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl shadow-blue-100">
                            <div>
                                <h3 className="text-page-title">一切准备就绪？</h3>
                                <p className="opacity-90 font-medium text-guide-title mt-2">确认品牌基石后，我们将为您配置专属活动物料。</p>
                            </div>
                            <button 
                                onClick={() => setCurrentStep(Step.CAMPAIGN_CONFIG)}
                                className="bg-white text-blue-600 cl-btn-primary hover:bg-blue-50 hover:text-blue-700 px-14 py-5 text-guide-title font-bold shadow-xl"
                            >
                                确认调性，开始配置
                            </button>
                        </div>
                        </div>
                    )}

                    {currentStep === Step.CAMPAIGN_CONFIG && (
                        <div className="space-y-10 animate-fadeIn">
                        <div className="bg-blue-600 rounded-[32px] p-10 text-white relative overflow-hidden">
                            <div className="relative z-10 space-y-2">
                                <h2 className="text-page-title">活动配置中心</h2>
                                <p className="text-guide-title opacity-80 font-medium">定义本次增长冲刺的核心利益点与运营规则。</p>
                            </div>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="cl-card p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-guide-title text-slate-800">活动类型</label>
                                    <select 
                                    className="w-full cl-input text-body-main appearance-none"
                                    value={campaign.activityType}
                                    onChange={(e) => setCampaign({...campaign, activityType: e.target.value as any})}
                                    >
                                    <option value="acquisition">✨ 私域拉新活动 (Welcome Series)</option>
                                    <option value="marketing">📅 日常营销活动 (Marketing Alert)</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-guide-title text-slate-800">活动名称</label>
                                    <input 
                                    className="w-full cl-input text-body-main"
                                    placeholder="例如: 夏日新会员惊喜日"
                                    value={campaign.activityName}
                                    onChange={(e) => setCampaign({...campaign, activityName: e.target.value})}
                                    />
                                </div>
                                
                                <div className="space-y-4 relative">
                                    <div className="flex justify-between items-center">
                                        <label className="text-guide-title text-slate-800">营销活动主题 (可选)</label>
                                        <button 
                                            onClick={handleGenerateThemes}
                                            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            disabled={isGeneratingThemes}
                                        >
                                            {isGeneratingThemes ? <span className="animate-spin">⏳</span> : <span>✨</span>}
                                            灵感联想
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            className="w-full cl-input text-body-main"
                                            placeholder="例如: 圣诞节, 元旦, 周年庆"
                                            value={campaign.campaignTheme || ''}
                                            onChange={(e) => setCampaign({...campaign, campaignTheme: e.target.value})}
                                            onFocus={() => { if(themeSuggestions.length > 0) setShowThemeSuggestions(true); }}
                                        />
                                        {showThemeSuggestions && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20 animate-fadeIn">
                                                 <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI 推荐主题</span>
                                                    <button onClick={() => setShowThemeSuggestions(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                                                 </div>
                                                 {isGeneratingThemes ? (
                                                    <div className="flex items-center justify-center py-4 text-slate-400 text-sm">
                                                        <span className="animate-spin mr-2">◌</span> 正在构思热门活动...
                                                    </div>
                                                 ) : (
                                                     <div className="flex flex-wrap gap-2">
                                                        {themeSuggestions.map((t, i) => (
                                                            <button 
                                                                key={i}
                                                                onClick={() => handleApplyTheme(t)}
                                                                className="bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-3 py-2 rounded-xl text-sm font-medium border border-slate-100 transition-colors"
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                     </div>
                                                 )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-guide-title text-slate-800">核心利益点</label>
                                    <input 
                                    className="w-full cl-input text-body-main"
                                    placeholder="例如: 免费领经典美式券"
                                    value={campaign.incentive}
                                    onChange={(e) => setCampaign({...campaign, incentive: e.target.value})}
                                    />
                                </div>
                                </div>

                                <div className="cl-card p-8 space-y-6">
                                    <h3 className="text-guide-title text-slate-800">配置生成清单</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                            <input type="checkbox" checked={campaign.materials.wecomWelcome} onChange={() => handleMaterialToggle('wecomWelcome')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
                                            <span className="text-body-main text-slate-700">1v1 欢迎语</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                            <input type="checkbox" checked={campaign.materials.wecomNotification} onChange={() => handleMaterialToggle('wecomNotification')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
                                            <span className="text-body-main text-slate-700">1v1 活动宣传文案</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                            <input type="checkbox" checked={campaign.materials.groupWelcome} onChange={() => handleMaterialToggle('groupWelcome')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
                                            <span className="text-body-main text-slate-700">社群欢迎语</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                            <input type="checkbox" checked={campaign.materials.groupNotification} onChange={() => handleMaterialToggle('groupNotification')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
                                            <span className="text-body-main text-slate-700">社群活动宣传文案</span>
                                        </label>
                                        
                                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                <input type="checkbox" checked={campaign.materials.momentsCopy} onChange={() => handleMaterialToggle('momentsCopy')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
                                                <span className="text-body-main text-slate-700">朋友圈宣传文案 (含海报)</span>
                                            </label>
                                            {campaign.materials.momentsCopy && (
                                                <input 
                                                    type="text" 
                                                    placeholder="海报尺寸 (如 9:16)" 
                                                    className="w-32 cl-input text-xs py-1 px-2 h-8"
                                                    value={campaign.materialDimensions.momentsPoster}
                                                    onChange={(e) => handleDimensionChange('momentsPoster', e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                <input type="checkbox" checked={campaign.materials.tableTent} onChange={() => handleMaterialToggle('tableTent')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
                                                <span className="text-body-main text-slate-700">门店拉新桌码海报</span>
                                            </label>
                                            {campaign.materials.tableTent && (
                                                <input 
                                                    type="text" 
                                                    placeholder="尺寸 (如 A5)" 
                                                    className="w-32 cl-input text-xs py-1 px-2 h-8"
                                                    value={campaign.materialDimensions.tableTent}
                                                    onChange={(e) => handleDimensionChange('tableTent', e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                <input type="checkbox" checked={campaign.materials.landingPage} onChange={() => handleMaterialToggle('landingPage')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"/>
                                                <span className="text-body-main text-slate-700">小程序领券落地页海报</span>
                                            </label>
                                            {campaign.materials.landingPage && (
                                                <input 
                                                    type="text" 
                                                    placeholder="尺寸 (如 9:16)" 
                                                    className="w-32 cl-input text-xs py-1 px-2 h-8"
                                                    value={campaign.materialDimensions.landingPage}
                                                    onChange={(e) => handleDimensionChange('landingPage', e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="cl-card p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                    <label className="text-guide-title text-slate-800">开始时间</label>
                                    <input type="date" className="w-full cl-input text-body-main" value={campaign.startTime} onChange={(e) => setCampaign({...campaign, startTime: e.target.value})} />
                                    </div>
                                    <div className="space-y-4">
                                    <label className="text-guide-title text-slate-800">结束时间</label>
                                    <input type="date" className="w-full cl-input text-body-main" value={campaign.endTime} onChange={(e) => setCampaign({...campaign, endTime: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-guide-title text-slate-800">参与规则</label>
                                    <textarea 
                                    className="w-full cl-input h-48 resize-none text-body-main"
                                    placeholder="1. 关注账号&#10;2. 添加小助手&#10;3. 入群领券..."
                                    value={campaign.rules}
                                    onChange={(e) => setCampaign({...campaign, rules: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                <div className="cl-card p-6 border-dashed border-2 flex flex-col items-center justify-center h-48 relative group">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'incentive')} />
                                    {campaign.incentiveImage ? (
                                    <img src={campaign.incentiveImage} className="absolute inset-0 w-full h-full object-cover rounded-[24px]" />
                                    ) : (
                                    <div className="text-center space-y-2">
                                        <span className="text-2xl">🎁</span>
                                        <p className="text-body-bold text-slate-400 uppercase">礼品主图</p>
                                    </div>
                                    )}
                                </div>
                                <div className="cl-card p-6 border-dashed border-2 flex flex-col items-center justify-center h-48 relative group">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'qrcode')} />
                                    {campaign.wecomQrCode ? (
                                    <img src={campaign.wecomQrCode} className="absolute inset-0 w-full h-full object-contain p-4" />
                                    ) : (
                                    <div className="text-center space-y-2">
                                        <span className="text-2xl">📱</span>
                                        <p className="text-body-bold text-slate-400 uppercase">企微二维码</p>
                                    </div>
                                    )}
                                </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button 
                            onClick={handleStartGeneration}
                            className="cl-btn-primary text-guide-title px-20 py-5 shadow-2xl shadow-blue-200"
                            disabled={!campaign.activityName || !campaign.incentive}
                            >
                            生成全套品牌物料
                            </button>
                        </div>
                        </div>
                    )}
                 </div>
             </div>
          )}

          {currentStep === Step.FINAL_PREVIEW && results && (
            <div className="h-full flex flex-col gap-4 animate-fadeIn relative overflow-hidden">
               
               {/* Strategy Edit Modal */}
               <StrategyEditModal 
                  isOpen={!!activeStrategyKey}
                  onClose={() => setActiveStrategyKey(null)}
                  title={activeStrategyKey === 'tableTent' ? '门店桌卡' : activeStrategyKey === 'landingPage' ? '小程序落地页' : '朋友圈海报'}
                  strategy={activeStrategyKey ? results.strategies[activeStrategyKey] : undefined}
                  onStrategyChange={(field, value) => activeStrategyKey && handleStrategyChange(activeStrategyKey, field, value)}
                  onRegenerate={handleStrategyRegenerateFromModal}
               />

               {/* Top Bar: Header & Compact Style Tuner */}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">交付清单</h2>
                    <p className="text-sm text-slate-500 mt-1">点击海报可调整 AI 生成策略。</p>
                  </div>
                  
                  <CompactStyleTuner 
                    options={toneOptions} 
                    onChange={setToneOptions} 
                    onRegenerate={handleRegenerate}
                    isRegenerating={isProcessing}
                  />
               </div>

               {/* Main Content Area - Split Layout */}
               <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                 
                 {/* Left Column: Copy Assets (Scrollable) */}
                 <div className="col-span-12 lg:col-span-4 flex flex-col min-h-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <span className="w-2 h-2 bg-yellow-400 rounded-full"></span> 话术资产
                     </h3>
                     <button 
                       onClick={() => handleSingleRegenerate('copy')}
                       disabled={regeneratingItems['copy']}
                       className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-blue-100"
                     >
                       {regeneratingItems['copy'] ? '优化中...' : '↻ 刷新文案'}
                     </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {/* Dynamic Copy Rendering */}
                     {results.copy.wecomWelcome && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">企微 1v1 欢迎语</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">"{results.copy.wecomWelcome}"</p>
                          </div>
                     )}
                     {results.copy.wecomNotification && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">1v1 活动宣传文案</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">"{results.copy.wecomNotification}"</p>
                          </div>
                     )}
                     {results.copy.groupWelcome && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">社群进群欢迎语</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">"{results.copy.groupWelcome}"</p>
                          </div>
                     )}
                     {results.copy.groupNotification && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">社群活动宣传文案</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">"{results.copy.groupNotification}"</p>
                          </div>
                     )}
                     {results.copy.momentsCopy && (
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">朋友圈宣传文案</p>
                             <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">"{results.copy.momentsCopy}"</p>
                         </div>
                     )}
                   </div>
                 </div>

                 {/* Right Column: Visual Materials (Fixed Grid/Flex) */}
                 <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
                   <div className="flex items-center justify-between mb-4 px-2">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <span className="w-2 h-2 bg-blue-600 rounded-full"></span> 视觉物料
                     </h3>
                     <div className="flex gap-2">
                        <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-1.5 px-4 rounded-lg text-xs font-bold transition-all">↓ 下载 PDF</button>
                        <button onClick={() => setCurrentStep(Step.INTRO)} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-1.5 px-4 rounded-lg text-xs font-bold transition-all">↺ 新项目</button>
                     </div>
                   </div>

                   <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                      {/* Item 1: Table Tent */}
                      {results.posters.tableTent && (
                           <div className="h-full min-h-[400px] lg:min-h-0">
                               <ImageCard 
                                src={results.posters.tableTent} 
                                label="门店桌卡"
                                isRegenerating={!!regeneratingItems['tableTent']}
                                onRegenerate={() => handleSingleRegenerate('tableTent')}
                                onClick={() => setActiveStrategyKey('tableTent')}
                                extraLabel={campaign.wecomQrCode && (
                                  <div className="absolute bottom-4 right-4 w-10 h-10 bg-white p-1 shadow-md border border-slate-100 rounded-md">
                                    <img src={campaign.wecomQrCode} className="w-full h-full object-contain" />
                                  </div>
                                )}
                              />
                           </div>
                      )}
                      
                      {/* Item 2: Landing Page */}
                      {results.posters.landingPage && (
                           <div className="h-full min-h-[400px] lg:min-h-0">
                               <ImageCard 
                                src={results.posters.landingPage} 
                                label="小程序落地页"
                                aspectRatioClass="aspect-[9/16] h-full"
                                isRegenerating={!!regeneratingItems['landingPage']}
                                onRegenerate={() => handleSingleRegenerate('landingPage')}
                                onClick={() => setActiveStrategyKey('landingPage')}
                              />
                           </div>
                      )}
                      
                      {/* Item 3: Moments Poster */}
                      {results.posters.momentsPoster && (
                        <div className="h-full min-h-[400px] lg:min-h-0">
                             <ImageCard 
                               src={results.posters.momentsPoster} 
                                label="朋友圈/社群海报"
                                aspectRatioClass="h-full"
                                isRegenerating={!!regeneratingItems['momentsPoster']}
                                onRegenerate={() => handleSingleRegenerate('momentsPoster')}
                                onClick={() => setActiveStrategyKey('moments')}
                             />
                        </div>
                      )}
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>

        <footer className="py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] shrink-0">
           BrandAI Studio • Powered by Gemini
        </footer>
      </main>
    </div>
  );
};

export default App;