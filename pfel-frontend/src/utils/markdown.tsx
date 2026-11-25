import React from 'react';

function formatInline(text: string): React.ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex).filter(Boolean);

  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 bg-gray-100 text-indigo-700 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic">{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 underline hover:text-indigo-800"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function renderMarkdownBlocks(markdown: string): React.ReactNode {
  if (!markdown.trim()) {
    return (
      <p className="text-xs text-gray-400 italic">
        Commencez à rédiger votre note de cours en Markdown pour voir l'aperçu...
      </p>
    );
  }

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      elements.push(
        <div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
          {lang && (
            <div className="px-3 py-1 bg-slate-800 text-[10px] font-mono uppercase text-slate-300">
              {lang}
            </div>
          )}
          <pre className="p-3.5 text-xs text-slate-100 font-mono overflow-x-auto">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-gray-900 mt-4 mb-1.5">
          {formatInline(line.slice(4))}
        </h3>
      );
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-extrabold text-gray-900 mt-5 mb-2">
          {formatInline(line.slice(3))}
        </h2>
      );
      i += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-extrabold text-gray-900 mt-4 mb-2 pb-1 border-b border-gray-200">
          {formatInline(line.slice(2))}
        </h1>
      );
      i += 1;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i += 1;
      }
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-3 pl-3.5 border-l-4 border-indigo-400 bg-indigo-50/50 py-2 pr-3 rounded-r-xl text-xs text-gray-700 italic"
        >
          {quoteLines.map((q, qIdx) => (
            <p key={qIdx}>{formatInline(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2.5 pl-5 list-disc space-y-1 text-sm text-gray-700">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="my-2 text-sm text-gray-700 leading-relaxed">
        {formatInline(line)}
      </p>
    );
    i += 1;
  }

  return <div className="space-y-1">{elements}</div>;
}
