// Types describe the linked tool or hosted service, not all models under a brand.
export const aiProjects = [
  ['vllm','vLLM','vllm-color','https://vllm.ai','open-source',['v llm'],['inference','serving','推理','模型服务'],'https://github.com/vllm-project/vllm'],
  ['deepseek','DeepSeek','deepseek-color','https://www.deepseek.com','commercial',['深度求索','deep seek'],['model provider','chat','模型服务','对话']],
  ['qwen','Qwen','qwen-color','https://qwen.ai','commercial',['通义千问','千问','tongyi'],['model provider','chat','模型服务','对话']],
  ['gemini','Google Gemini','gemini-color','https://gemini.google.com','commercial',['gemini','谷歌 Gemini','谷歌双子座'],['model provider','chat','multimodal','多模态']],
  ['chatgpt','ChatGPT','openai','https://chatgpt.com','commercial',['chat gpt','OpenAI','聊天 GPT'],['chat','assistant','对话','助手']],
  ['claude','Claude','claude-color','https://claude.ai','commercial',['Anthropic','克劳德'],['chat','assistant','对话','助手']],
  ['huggingface','Hugging Face','huggingface-color','https://huggingface.co','commercial',['hugging face','抱抱脸'],['model hub','datasets','模型社区','数据集']],
  ['langchain','LangChain','langchain-color','https://www.langchain.com','open-source',['lang chain'],['RAG','agents','智能体','应用框架'],'https://github.com/langchain-ai/langchain'],
  ['llamaindex','LlamaIndex','llamaindex-color','https://www.llamaindex.ai','open-source',['llama index'],['RAG','retrieval','检索增强','知识库'],'https://github.com/run-llama/llama_index'],
  ['dify','Dify','dify-color','https://dify.ai','source-available',[],['workflow','agents','RAG','工作流','智能体'],'https://github.com/langgenius/dify'],
  ['open-webui','Open WebUI','openwebui','https://openwebui.com','source-available',['openwebui','open web ui'],['self-hosted','chat','自托管','对话界面'],'https://github.com/open-webui/open-webui'],
  ['lmstudio','LM Studio','lmstudio','https://lmstudio.ai','commercial',['lm studio'],['local inference','desktop','本地推理','桌面']],
  ['perplexity','Perplexity','perplexity-color','https://www.perplexity.ai','commercial',['perplexity ai'],['search','answer engine','搜索','答案引擎']],
  ['comfyui','ComfyUI','comfyui-color','https://www.comfy.org','open-source',['comfy ui'],['diffusion','image generation','workflow','图像生成','工作流'],'https://github.com/Comfy-Org/ComfyUI'],
  ['cursor','Cursor','cursor','https://cursor.com','commercial',['cursor ai'],['coding','editor','代码助手','编辑器']],
  ['github-copilot','GitHub Copilot','githubcopilot','https://github.com/features/copilot','commercial',['githubcopilot','github copilot'],['coding','代码助手']],
].map(([id,name,artwork,homepage,softwareType,aliases,tags,repository])=>({id,name,artwork,source:'lobe',homepage,softwareType,aliases,tags:['AI','LLM','人工智能','大模型',...tags],repository:repository??null}));

export const aiMetadata = new Map(aiProjects.map(project=>[project.id,project]));
export const aiSourcePaths = Object.fromEntries(aiProjects.map(({id,artwork})=>[id,`packages/static-svg/icons/${artwork}.svg`]));
