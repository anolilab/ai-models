# Product Requirements Document: Extending Model Schema for Multimedia AI Models

## 1. Executive Summary

Currently, the provider registry only supports text-based language models. This PRD proposes extending the schema to support multimedia AI models (image generation, video generation, audio processing, etc.) while maintaining backward compatibility with existing text models.

## 2. Problem Statement

### Current Limitations
- Schema only supports text input/output modalities
- Pricing structure assumes token-based billing
- Capabilities focused on text model features (reasoning, tool calling, etc.)
- No support for image, video, audio, or multimodal models

### Business Need
- Capture the growing market of multimedia AI models
- Support providers like Alibaba's 通义万相, OpenAI's DALL-E, Midjourney, etc.
- Enable comprehensive model comparison across different AI capabilities
- Future-proof the registry for emerging AI modalities

## 3. Proposed Solution

### 3.1 Extended Schema Design

```typescript
// Base Model interface (existing)
interface BaseModel {
  id: string;
  name: string;
  provider: string;
  releaseDate: string | null;
  lastUpdated: string | null;
  streamingSupported: boolean;
  // Provider metadata (existing)
  providerEnv?: string[];
  providerNpm?: string;
  providerDoc?: string;
  providerModelsDevId?: string;
}

// Text Model (existing, renamed for clarity)
interface TextModel extends BaseModel {
  type: 'text';
  // Text-specific capabilities
  reasoning: boolean;
  temperature: boolean;
  toolCall: boolean;
  openWeights: boolean;
  vision: boolean;
  extendedThinking: boolean;
  knowledge: string | null;
  
  // Text-specific pricing
  cost: {
    input: number | null;      // per 1K tokens
    output: number | null;     // per 1K tokens
    inputCacheHit: number | null;
  };
  
  // Text-specific limits
  limit: {
    context: number | null;    // max tokens
    output: number | null;     // max tokens
  };
  
  // Text modalities
  modalities: {
    input: ('text' | 'image')[];  // Support vision models
    output: ('text')[];
  };
}

// Image Generation Model
interface ImageModel extends BaseModel {
  type: 'image';
  
  // Image-specific capabilities
  imageCapabilities: {
    textToImage: boolean;
    imageToImage: boolean;
    inpainting: boolean;
    outpainting: boolean;
    styleTransfer: boolean;
    faceEditing: boolean;
    objectRemoval: boolean;
    backgroundReplacement: boolean;
  };
  
  // Image-specific pricing
  cost: {
    perImage: number | null;           // per image
    perImageHD: number | null;         // per HD image
    perImage4K: number | null;         // per 4K image
    perImageWithVariations: number | null; // per image with variations
  };
  
  // Image-specific limits
  limit: {
    maxResolution: string | null;      // e.g., "1024x1024"
    maxAspectRatio: string | null;     // e.g., "16:9"
    maxImagesPerRequest: number | null;
    supportedFormats: string[];        // e.g., ["png", "jpg", "webp"]
  };
  
  // Image modalities
  modalities: {
    input: ('text' | 'image')[];
    output: ('image')[];
  };
}

// Video Generation Model
interface VideoModel extends BaseModel {
  type: 'video';
  
  // Video-specific capabilities
  videoCapabilities: {
    textToVideo: boolean;
    imageToVideo: boolean;
    videoToVideo: boolean;
    videoEditing: boolean;
    motionGeneration: boolean;
    lipSync: boolean;
    faceSwapping: boolean;
    styleTransfer: boolean;
  };
  
  // Video-specific pricing
  cost: {
    perSecond: number | null;          // per second of video
    perSecondHD: number | null;        // per second of HD video
    perSecond4K: number | null;        // per second of 4K video
    perVideo: number | null;           // per video (fixed price)
  };
  
  // Video-specific limits
  limit: {
    maxDuration: number | null;        // max seconds
    maxResolution: string | null;      // e.g., "1920x1080"
    maxFPS: number | null;             // frames per second
    supportedFormats: string[];        // e.g., ["mp4", "mov", "avi"]
  };
  
  // Video modalities
  modalities: {
    input: ('text' | 'image' | 'video')[];
    output: ('video')[];
  };
}

// Audio Model
interface AudioModel extends BaseModel {
  type: 'audio';
  
  // Audio-specific capabilities
  audioCapabilities: {
    textToSpeech: boolean;
    speechToText: boolean;
    audioToAudio: boolean;
    musicGeneration: boolean;
    voiceCloning: boolean;
    audioEditing: boolean;
    noiseReduction: boolean;
  };
  
  // Audio-specific pricing
  cost: {
    perSecond: number | null;          // per second of audio
    perMinute: number | null;          // per minute of audio
    perCharacter: number | null;       // per character (TTS)
  };
  
  // Audio-specific limits
  limit: {
    maxDuration: number | null;        // max seconds
    maxFileSize: number | null;        // max MB
    supportedFormats: string[];        // e.g., ["mp3", "wav", "flac"]
    supportedLanguages: string[];      // e.g., ["en", "zh", "es"]
  };
  
  // Audio modalities
  modalities: {
    input: ('text' | 'audio')[];
    output: ('audio')[];
  };
}

// Multimodal Model (supports multiple types)
interface MultimodalModel extends BaseModel {
  type: 'multimodal';
  
  // Combined capabilities
  textCapabilities?: Partial<TextModel>;
  imageCapabilities?: Partial<ImageModel['imageCapabilities']>;
  videoCapabilities?: Partial<VideoModel['videoCapabilities']>;
  audioCapabilities?: Partial<AudioModel['audioCapabilities']>;
  
  // Combined pricing
  cost: {
    // Text pricing
    input?: number | null;
    output?: number | null;
    inputCacheHit?: number | null;
    // Image pricing
    perImage?: number | null;
    perImageHD?: number | null;
    perImage4K?: number | null;
    // Video pricing
    perSecond?: number | null;
    perSecondHD?: number | null;
    perSecond4K?: number | null;
    // Audio pricing
    perSecondAudio?: number | null;
    perMinuteAudio?: number | null;
    perCharacter?: number | null;
  };
  
  // Combined limits
  limit: {
    // Text limits
    context?: number | null;
    output?: number | null;
    // Image limits
    maxImageResolution?: string | null;
    maxImagesPerRequest?: number | null;
    // Video limits
    maxVideoDuration?: number | null;
    maxVideoResolution?: string | null;
    // Audio limits
    maxAudioDuration?: number | null;
    maxAudioFileSize?: number | null;
  };
  
  // Multimodal modalities
  modalities: {
    input: ('text' | 'image' | 'video' | 'audio')[];
    output: ('text' | 'image' | 'video' | 'audio')[];
  };
}

// Union type for all model types
type Model = TextModel | ImageModel | VideoModel | AudioModel | MultimodalModel;
```

### 3.2 Backward Compatibility Strategy

```typescript
// Migration helper function
function migrateTextModel(oldModel: any): TextModel {
  return {
    ...oldModel,
    type: 'text',
    // Ensure all required fields are present
    reasoning: oldModel.reasoning ?? false,
    temperature: oldModel.temperature ?? false,
    toolCall: oldModel.toolCall ?? false,
    openWeights: oldModel.openWeights ?? false,
    vision: oldModel.vision ?? false,
    extendedThinking: oldModel.extendedThinking ?? false,
    knowledge: oldModel.knowledge ?? null,
    cost: {
      input: oldModel.cost?.input ?? null,
      output: oldModel.cost?.output ?? null,
      inputCacheHit: oldModel.cost?.inputCacheHit ?? null,
    },
    limit: {
      context: oldModel.limit?.context ?? null,
      output: oldModel.limit?.output ?? null,
    },
    modalities: {
      input: oldModel.modalities?.input ?? ['text'],
      output: oldModel.modalities?.output ?? ['text'],
    },
  };
}
```

### 3.3 Updated Zod Schema

```typescript
import { z } from 'zod';

// Base schema
const BaseModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  releaseDate: z.string().nullable(),
  lastUpdated: z.string().nullable(),
  streamingSupported: z.boolean(),
  providerEnv: z.array(z.string()).optional(),
  providerNpm: z.string().optional(),
  providerDoc: z.string().optional(),
  providerModelsDevId: z.string().optional(),
});

// Text model schema
const TextModelSchema = BaseModelSchema.extend({
  type: z.literal('text'),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  toolCall: z.boolean(),
  openWeights: z.boolean(),
  vision: z.boolean(),
  extendedThinking: z.boolean(),
  knowledge: z.string().nullable(),
  cost: z.object({
    input: z.number().nullable(),
    output: z.number().nullable(),
    inputCacheHit: z.number().nullable(),
  }),
  limit: z.object({
    context: z.number().nullable(),
    output: z.number().nullable(),
  }),
  modalities: z.object({
    input: z.array(z.enum(['text', 'image'])),
    output: z.array(z.literal('text')),
  }),
});

// Image model schema
const ImageModelSchema = BaseModelSchema.extend({
  type: z.literal('image'),
  imageCapabilities: z.object({
    textToImage: z.boolean(),
    imageToImage: z.boolean(),
    inpainting: z.boolean(),
    outpainting: z.boolean(),
    styleTransfer: z.boolean(),
    faceEditing: z.boolean(),
    objectRemoval: z.boolean(),
    backgroundReplacement: z.boolean(),
  }),
  cost: z.object({
    perImage: z.number().nullable(),
    perImageHD: z.number().nullable(),
    perImage4K: z.number().nullable(),
    perImageWithVariations: z.number().nullable(),
  }),
  limit: z.object({
    maxResolution: z.string().nullable(),
    maxAspectRatio: z.string().nullable(),
    maxImagesPerRequest: z.number().nullable(),
    supportedFormats: z.array(z.string()),
  }),
  modalities: z.object({
    input: z.array(z.enum(['text', 'image'])),
    output: z.array(z.literal('image')),
  }),
});

// Union schema for all model types
const ModelSchema = z.discriminatedUnion('type', [
  TextModelSchema,
  ImageModelSchema,
  // Add VideoModelSchema, AudioModelSchema, MultimodalModelSchema
]);
```

### 3.4 Data Sources for Implementation

#### Alibaba Cloud Model Studio URLs

**Text Models:**
- 通义千问 (Qwen): `/zh/model-studio/use-qwen-by-calling-api`
- DeepSeek: `/zh/model-studio/deepseek-api`
- Kimi: `/zh/model-studio/kimi-api`

**Image Generation Models:**
- 通义万相-文生图V2版: `/zh/model-studio/text-to-image-v2-api-reference`
- 通义万相-文生图V1版: `/zh/model-studio/text-to-image-api-reference`
- 通义万相-通用图像编辑: `/zh/model-studio/wanx-image-edit-api-reference`
- 通义万相-涂鸦作画: `/zh/model-studio/wanx-sketch-to-image-api-reference`
- 通义万相-图像局部重绘: `/zh/model-studio/vary-region-api-reference`
- 人像风格重绘: `/zh/model-studio/portrait-style-redraw-api-reference`
- 图像画面扩展: `/zh/model-studio/image-scaling-api`
- 虚拟模特: `/zh/model-studio/virtual-model-api-details`
- 鞋靴模特: `/zh/model-studio/shoe-model-api`
- 创意海报生成: `/zh/model-studio/creative-poster-generation`
- 人物实例分割: `/zh/model-studio/image-instance-segmentation-api-reference`
- 图像背景生成: `/zh/model-studio/wanx-background-generation-api-reference`
- 图像擦除补全: `/zh/model-studio/image-erase-completion-api-reference`
- AI试衣OutfitAnyone: `/zh/model-studio/outfitanyone/`
- 人物写真FaceChain: `/zh/model-studio/facechain-portrait-generation/`
- 创意文字WordArt锦书: `/zh/model-studio/wordart-quick-start/`
- 文生图StableDiffusion: `/zh/model-studio/stable-diffusion-quick-start/`
- 文生图FLUX: `/zh/model-studio/flux-api-reference/`

**Video Generation Models:**
- 通义万相-图生视频-基于首帧: `/zh/model-studio/image-to-video-api-reference/`
- 通义万相-图生视频-基于首尾帧: `/zh/model-studio/image-to-video-by-first-and-last-frame-api-reference`
- 通义万相-文生视频: `/zh/model-studio/text-to-video-api-reference`
- 通义万相-通用视频编辑: `/zh/model-studio/wanx-vace-api-reference`
- 图生舞蹈视频-舞动人像AnimateAnyone: `/zh/model-studio/animateanyone-quick-start/`
  - AnimateAnyone 图像检测: `/zh/model-studio/animate-anyone-detect-api`
  - AnimateAnyone 动作模板生成: `/zh/model-studio/animate-anyone-template-api`
  - AnimateAnyone 视频生成: `/zh/model-studio/animateanyone-video-generation-api`
- 图生唱演视频-悦动人像EMO: `/zh/model-studio/emo-quick-start/`
  - EMO 图像检测: `/zh/model-studio/emo-detect-api`
  - EMO 视频生成: `/zh/model-studio/emo-api`
- 图生播报视频-灵动人像LivePortrait: `/zh/model-studio/liveportrait-quick-start/`
  - LivePortrait 图像检测: `/zh/model-studio/liveportrait-detect-api`
  - LivePortrait 视频生成: `/zh/model-studio/liveportrait-api`
- 视频口型替换-声动人像VideoRetalk: `/zh/model-studio/videoretalk/`
  - VideoRetalk视频生成: `/zh/model-studio/videoretalk-api`
- 图生表情包视频-表情包Emoji: `/zh/model-studio/emoji-quick-start/`
  - Emoji 图像检测: `/zh/model-studio/emoji-detect-api`
  - Emoji 视频生成: `/zh/model-studio/emoji-api`
- 视频风格重绘: `/zh/model-studio/video-style-transform-api-reference`

**Audio Models:**
- 实时语音合成: `/zh/model-studio/qwen-tts-realtime-api/`
- 语音合成/识别/翻译: `/zh/model-studio/developer-reference/speech-synthesis-and-speech-recognition/`

**Multimodal Models:**
- 实时多模态: `/zh/model-studio/omni-realtime-api/`

**Vector Models:**
- 通用文本向量: `/zh/model-studio/general-text-embedding/`
- 多模态向量: `/zh/model-studio/developer-reference/multimodal-vector/`

**Base URL:** `https://help.aliyun.com`

## 4. Implementation Plan

### Phase 1: Schema Extension (Week 1-2)
1. Update `schema.ts` with new model types
2. Create migration script for existing data
3. Update Zod validation schemas
4. Add type guards and utility functions

### Phase 2: Transformer Updates (Week 3-4)
1. Update existing transformers to use new schema
2. Create new transformers for multimedia providers
3. Add support for Alibaba's 通义万相 models
4. Add support for other multimedia providers (Midjourney, DALL-E, etc.)

### Phase 3: UI/UX Updates (Week 5-6)
1. Update model comparison interface
2. Add filters for model types
3. Update pricing display for different modalities
4. Add capability visualization for multimedia models

### Phase 4: Testing & Documentation (Week 7-8)
1. Comprehensive testing of new schema
2. Update documentation
3. Performance testing with larger datasets
4. User acceptance testing

## 5. Benefits

### Technical Benefits
- **Scalability**: Easy to add new model types
- **Type Safety**: Strong TypeScript support with discriminated unions
- **Backward Compatibility**: Existing text models continue to work
- **Flexibility**: Support for complex multimodal models

### Business Benefits
- **Market Coverage**: Support for growing multimedia AI market
- **Competitive Advantage**: Comprehensive model registry
- **Future-Proof**: Ready for emerging AI capabilities
- **User Value**: Better model comparison across modalities

## 6. Risks & Mitigation

### Risks
1. **Schema Complexity**: New schema is more complex
2. **Migration Risk**: Existing data migration could fail
3. **Performance Impact**: Larger schema might impact performance
4. **Provider Adoption**: Not all providers may have multimedia models

### Mitigation
1. **Gradual Rollout**: Implement in phases with thorough testing
2. **Backup Strategy**: Maintain backup of existing data
3. **Performance Testing**: Benchmark before and after changes
4. **Optional Implementation**: Make multimedia support optional

## 7. Success Metrics

- [ ] 100% backward compatibility with existing text models
- [ ] Support for at least 3 multimedia providers
- [ ] Zero data loss during migration
- [ ] Performance within 10% of current baseline
- [ ] User satisfaction with new model type filters

## 8. Conclusion

This schema extension will position the provider registry as a comprehensive solution for all types of AI models, not just text-based ones. The phased approach ensures minimal disruption while enabling significant new capabilities. 