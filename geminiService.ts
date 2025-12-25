
import { GoogleGenAI, Type } from "@google/genai";
import { BrandProfile, CampaignConfig, ToneOptions, AIStrategies, MaterialSelection } from "./types";

export const analyzeBrand = async (inputs: { brandName: string, text: string, images: string[], menuImages: string[] }): Promise<BrandProfile> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    作为资深品牌专家，请针对品牌 "${inputs.brandName}" 进行深度分析。
    
    你目前拥有以下资源：
    1. 品牌名称: ${inputs.brandName} (请使用 googleSearch 工具联网搜索该品牌的最新定位、门店信息、大众点评/社交媒体评价等)。
    2. 用户补充描述: ${inputs.text}
    3. 视觉素材 (KV/Logo): 已通过图片零件上传。
    4. 门店菜单: 已上传图片，请分析产品矩阵与定价逻辑。

    任务：输出一份针对该品牌的私域调性分析文档。
    要求：
    - 使用中文输出。
    - 结合联网搜索到的品牌真实市场地位，验证或补充用户描述的准确性。
    - 分析菜单价格，判断属于“快消”、“轻奢”还是“精品”定位。
    - 确立在企微私域中应扮演的人设（如：贴心主理人、专业茶师、福利官等）。
    
    输出包含：
    1. 私域人设基石 (Persona)
    2. 文案风格 (Tone of Voice)
    3. 视觉风格建议 (Visual Style)
    4. 核心受众 (Target Audience)
    5. 品牌关键词 (Keywords)
  `;

  const allImages = [...inputs.images, ...inputs.menuImages];
  const imageParts = allImages.map(base64 => ({
    inlineData: {
      data: base64.split(',')[1],
      mimeType: "image/png"
    }
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: prompt },
        ...imageParts
      ]
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          persona: { type: Type.STRING },
          toneOfVoice: { type: Type.STRING },
          visualStyle: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          brandKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["persona", "toneOfVoice", "visualStyle", "targetAudience", "brandKeywords"]
      }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text);
};

export const generateStrategies = async (profile: BrandProfile, config: CampaignConfig): Promise<AIStrategies> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { materials } = config;
  
  let prompt = `
    作为餐饮营销视觉策划专家，请为活动 "${config.activityName}" 的物料制定设计策略。
    品牌风格: ${profile.visualStyle}
    受众: ${profile.targetAudience}
    营销主题 (Campaign Theme): ${config.campaignTheme || "无特定节日主题，保持品牌通用风格"}
    
    请分析以下需要生成场景的特征 (features) 和对应的 AI 设计策略 (tactics, 列出3-4点):
  `;

  const schemaProperties: any = {};
  const requiredFields: string[] = [];

  if (materials.tableTent) {
    prompt += `\n- 拉新台卡 (Table Tent): 放在餐桌上，用户正在进食，距离近，扫码方便。尺寸: ${config.materialDimensions.tableTent}`;
    schemaProperties.tableTent = {
      type: Type.OBJECT,
      properties: { features: { type: Type.STRING }, tactics: { type: Type.ARRAY, items: { type: Type.STRING } } }
    };
    requiredFields.push("tableTent");
  }

  if (materials.momentsCopy) {
    prompt += `\n- 朋友圈/社群活动海报 (Moments): 社交属性强，需要引发兴趣，通知性强。尺寸: ${config.materialDimensions.momentsPoster}`;
    schemaProperties.moments = {
      type: Type.OBJECT,
      properties: { features: { type: Type.STRING }, tactics: { type: Type.ARRAY, items: { type: Type.STRING } } }
    };
    requiredFields.push("moments");
  }

  if (materials.landingPage) {
    prompt += `\n- 小程序领券落地页海报 (Landing Page): 用户扫码后看到的详细领券页面，重点在转化。尺寸: ${config.materialDimensions.landingPage}`;
    schemaProperties.landingPage = {
      type: Type.OBJECT,
      properties: { features: { type: Type.STRING }, tactics: { type: Type.ARRAY, items: { type: Type.STRING } } }
    };
    requiredFields.push("landingPage");
  }
    
  prompt += `\n请用中文简洁回答。如果涉及节日主题，请在策略中体现节日元素。`;

  if (requiredFields.length === 0) {
      return {};
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: schemaProperties,
        required: requiredFields
      }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text);
};

export const generateCopy = async (profile: BrandProfile, config: CampaignConfig, options?: ToneOptions) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { materials } = config;
  
  const isAcquisition = config.activityType === 'acquisition';

  let modifierPrompt = "";
  if (options) {
    const toneMap = { 
      professional: "专业严谨", 
      friendly: "亲切活泼", 
      humorous: "幽默风趣",
      enthusiastic: "热情洋溢，充满感染力",
      elegant: "优雅知性，富有格调"
    };

    let lengthInstruction = "";
    if (options.copyLength === 'custom') {
       lengthInstruction = options.customCopyLength || "根据上下文自动调整";
    } else {
       const lengthMap = { 
        concise: "短小精悍，一目了然", 
        balanced: "详略得当，重点突出", 
        detailed: "详细丰富，情感充沛", 
        bullet: "清单体，要点清晰，结构化强" 
       };
       lengthInstruction = lengthMap[options.copyLength as keyof typeof lengthMap];
    }
    
    modifierPrompt = `
      [重要调整指令]：
      1. 文案语气请务必调整为：${toneMap[options.tone]}。
      2. 文案篇幅请严格控制为：${lengthInstruction}。
    `;
  }

  let copyRequests = "生成以下私域文案，必须使用中文：\n";
  const properties: any = {};
  const required: string[] = [];

  if (materials.wecomWelcome) {
    copyRequests += "1. 企微1v1欢迎语 (wecomWelcome)：亲切自然，引导添加社群或领券。\n";
    properties.wecomWelcome = { type: Type.STRING };
    required.push("wecomWelcome");
  }

  if (materials.wecomNotification) {
    copyRequests += "2. 1v1活动通知 (wecomNotification)：简洁明了，通知用户有新活动，唤醒沉睡用户。\n";
    properties.wecomNotification = { type: Type.STRING };
    required.push("wecomNotification");
  }

  if (materials.groupWelcome) {
    copyRequests += "3. 社群进群欢迎语 (groupWelcome)：活跃氛围，突出入群福利，强调限时。\n";
    properties.groupWelcome = { type: Type.STRING };
    required.push("groupWelcome");
  }

  if (materials.groupNotification) {
    copyRequests += "4. 社群活动通知 (groupNotification)：群公告风格，号召大家参与。\n";
    properties.groupNotification = { type: Type.STRING };
    required.push("groupNotification");
  }

  if (materials.momentsCopy) {
    copyRequests += "5. 朋友圈宣传文案 (momentsCopy)：吸引眼球，配图建议。\n";
    properties.momentsCopy = { type: Type.STRING };
    required.push("momentsCopy");
  }

  const prompt = `
    根据品牌调性：${JSON.stringify(profile)}
    以及活动详情：
    - 活动类型: ${isAcquisition ? "拉新活动" : "日常营销活动"}
    - 活动名称: ${config.activityName}
    - 营销主题: ${config.campaignTheme || "无特定节日主题，保持日常风格"}
    - 利益点: ${config.incentive}
    - 活动时间: ${config.startTime} 至 ${config.endTime}
    - 活动规则: ${config.rules}
    
    请在文案中巧妙融入营销主题（如有），并符合品牌人设。
    ${modifierPrompt}

    ${copyRequests}
  `;

  if (required.length === 0) return {};

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: properties,
        required: required
      }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text);
};

export const generatePoster = async (
  profile: BrandProfile, 
  config: CampaignConfig, 
  dimensionInput: string, 
  options?: ToneOptions,
  customStrategy?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Normalize dimension input
  const rawDim = dimensionInput.toLowerCase().trim();
  type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  let aspectRatio: AspectRatio = '3:4'; // Default safe fallback

  const ratioMap: Record<string, AspectRatio> = {
    '1:1': '1:1',
    '3:4': '3:4',
    '4:3': '4:3',
    '9:16': '9:16',
    '16:9': '16:9',
    'a4': '3:4',
    'a5': '3:4',
    'a3': '3:4'
  };

  if (ratioMap[rawDim]) {
    aspectRatio = ratioMap[rawDim];
  } else {
    // Attempt simple heuristic or fallback
    // If user inputs something we can't map to API config, we default to 3:4 for vertical or 4:3 if they specified something else.
    // For now, default to 3:4 to be safe, but include the raw requirement in prompt.
    if (rawDim.includes('16') && rawDim.includes('9')) {
       // rough check for 16:9 vs 9:16.
       // Default to 9:16 for mobile if ambiguous or 16:9 if landscape specified
    }
  }

  let styleModifier = "";
  if (options) {
    if (options.visualStyle === 'custom') {
        styleModifier = `Visual Style Adjustment: strictly follow this style -> ${options.customVisualStyle || "Professional High-end"}.`;
    } else {
        const styleMap = { 
        minimalist: "Minimalist, Clean, High-end, lots of white space", 
        vibrant: "Vibrant, Colorful, Pop Art, High Energy", 
        luxury: "Dark mode, Gold accents, Premium texture, Cinematic lighting",
        retro: "Retro style, Vintage aesthetics, Nostalgic colors, Grainy texture",
        natural: "Natural, Organic, Fresh, Greenery, Soft sunlight"
        };
        styleModifier = `Visual Style Adjustment: strictly follow this style -> ${styleMap[options.visualStyle as keyof typeof styleMap]}.`;
    }
  }

  let strategyInstruction = "";
  if (customStrategy) {
    strategyInstruction = `
    IMPORTANT DESIGN STRATEGY / LAYOUT RULES:
    ${customStrategy}
    (Strictly follow the above strategy regarding layout, font size, and element placement.)
    `;
  }

  const parts: any[] = [
    { text: `
      Create a high-end F&B marketing poster for activity "${config.activityName}".
      Campaign/Holiday Theme: ${config.campaignTheme || "General Brand Style"}.
      Target Dimensions/Size: "${dimensionInput}" (Ensure composition fits this aspect ratio).
      Base Brand Style: ${profile.visualStyle}. 
      ${styleModifier}
      
      ${strategyInstruction}

      Brand Persona: ${profile.persona}.
      Main Incentive: "${config.incentive}".
      Activity Duration: "${config.startTime} - ${config.endTime}".
      Composition: Professional typography, premium food photography style.
      Text on poster should be in Chinese.
    `}
  ];

  if (config.incentiveImage) {
    parts.push({
      inlineData: {
        data: config.incentiveImage.split(',')[1],
        mimeType: "image/png"
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
      }
    }
  });

  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("Failed to generate image");
};

export const generateCampaignThemes = async (profile: BrandProfile): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toLocaleDateString('zh-CN');

  const prompt = `
    Based on the brand profile and today's date (${today}), suggest 5 creative marketing campaign themes suitable for a F&B brand.
    
    Brand Profile:
    - Persona: ${profile.persona}
    - Tone: ${profile.toneOfVoice}
    - Audience: ${profile.targetAudience}

    Consider upcoming holidays in China, seasonal characteristics, or generic engagement themes.
    Return ONLY a JSON array of strings in Chinese. Example: ["夏季清凉节", "七夕限定礼", "周末放松日"]
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  const text = response.text || "[]";
  return JSON.parse(text);
};
