import React from 'react';
import Openai from '@thesvg/react/openai';
import Anthropic from '@thesvg/react/anthropic';
import Deepseek from '@thesvg/react/deepseek';
import Qwen from '@thesvg/react/qwen';
import Gemini from '@thesvg/react/google-gemini';
import Nvidia from '@thesvg/react/nvidia';
import { Bot, Workflow } from 'lucide-react';

// Marks identify a model family, not the transport or an endorsement.
export function ModelMark({ id = '', size = 16 }) {
  const value = id.toLowerCase();
  const Mark =
    value === 'scripted-reference'
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
                  : Bot;
  return <Mark className="model-mark" width={size} height={size} aria-hidden="true" />;
}
