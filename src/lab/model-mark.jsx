import React from 'react';
import Openai from '@thesvg/react/openai';
import Anthropic from '@thesvg/react/anthropic';
import Deepseek from '@thesvg/react/deepseek';
import Qwen from '@thesvg/react/qwen';
import Gemini from '@thesvg/react/google-gemini';
import Nvidia from '@thesvg/react/nvidia';
import Mistral from '@thesvg/react/mistral-ai';
import Meta from '@thesvg/react/metaai';
import Xai from '@thesvg/react/xai';
import Cohere from '@thesvg/react/cohere';
import Moonshot from '@thesvg/react/moonshot-ai';
import { Bot, Workflow } from 'lucide-react';

// Marks identify a model family, not the transport or an endorsement.
export function ModelMark({ id = '', size = 16 }) {
  const value = id.toLowerCase();
  const Mark =
    value === 'scripted-reference' || /^jev(?:-|$)/.test(value)
      ? Workflow
      : /(^|\/)(gpt|o[134](?:-|$))|openai/.test(value)
        ? Openai
        : /claude|anthropic/.test(value)
          ? Anthropic
          : /deepseek/.test(value)
            ? Deepseek
            : /qwen/.test(value)
              ? Qwen
              : /gemini/.test(value)
                ? Gemini
                : /nemotron|nvidia/.test(value)
                  ? Nvidia
                  : /mistral|mixtral|codestral/.test(value)
                    ? Mistral
                    : /llama|meta[/-]/.test(value)
                      ? Meta
                      : /grok|xai/.test(value)
                        ? Xai
                        : /cohere|command-r/.test(value)
                          ? Cohere
                          : /kimi|moonshot/.test(value)
                            ? Moonshot
                            : Bot;
  // These upstream defaults are white marks intended for dark backgrounds.
  const variant = [Openai, Anthropic, Qwen, Nvidia].includes(Mark) ? 'light' : undefined;
  return (
    <Mark variant={variant} className="model-mark" width={size} height={size} aria-hidden="true" />
  );
}
