import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp, Bot, RotateCcw, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUi } from '@/store/ui'
import { answer, contextFor } from './answers'

interface Msg {
  id: number
  role: 'user' | 'ai'
  text: string
  streaming?: boolean
}

let msgId = 0

/** Very small markdown subset: paragraphs, bullets, numbered lists, **bold**, _italic_, > quotes. */
export function MiniMarkdown({ text }: { text: string }) {
  const blocks = text.split('\n')
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, i) =>
      part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part.startsWith('_') && part.endsWith('_') && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em> : part,
    )
  return (
    <div className="space-y-1">
      {blocks.map((b, i) => {
        if (!b.trim()) return <div key={i} className="h-1" />
        if (b.startsWith('- ')) return <div key={i} className="flex gap-1.5 pl-1"><span className="text-muted-foreground">•</span><span>{inline(b.slice(2))}</span></div>
        if (/^\d+\. /.test(b)) return <div key={i} className="pl-1">{inline(b)}</div>
        if (b.startsWith('> ')) return <div key={i} className="border-l-2 border-ai-border pl-2 italic text-muted-foreground">{inline(b.slice(2))}</div>
        return <p key={i}>{inline(b)}</p>
      })}
    </div>
  )
}

export function CopilotDrawer() {
  const open = useUi((s) => s.copilotOpen)
  const seed = useUi((s) => s.copilotSeed)
  const setOpen = useUi((s) => s.setCopilot)
  const location = useLocation()
  const ctx = contextFor(location.pathname)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, thinking])
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])
  useEffect(() => {
    if (open && seed) {
      ask(seed)
      useUi.setState({ copilotSeed: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, open])

  const ask = (q: string) => {
    if (!q.trim() || thinking) return
    const text = answer(q, ctx, useData.getState())
    useData.getState().bumpAi()
    const userMsg: Msg = { id: ++msgId, role: 'user', text: q }
    const aiId = ++msgId
    setMessages((m) => [...m, userMsg])
    setInput('')
    setThinking(true)
    timers.current.push(
      window.setTimeout(() => {
        setThinking(false)
        setMessages((m) => [...m, { id: aiId, role: 'ai', text: '', streaming: true }])
        const words = text.split(/(\s+)/)
        let i = 0
        const step = () => {
          i = Math.min(words.length, i + 6)
          const partial = words.slice(0, i).join('')
          setMessages((m) => m.map((x) => (x.id === aiId ? { ...x, text: partial, streaming: i < words.length } : x)))
          if (i < words.length) timers.current.push(window.setTimeout(step, 30))
        }
        step()
      }, 750),
    )
  }

  if (!open) return null

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l bg-background" aria-label="AI Copilot">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ai text-ai-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">Copilot</div>
          <div className="truncate text-2xs text-muted-foreground">Context: {ctx.label}</div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon-sm" aria-label="Clear conversation" onClick={() => setMessages([])}>
            <RotateCcw />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" aria-label="Close Copilot" onClick={() => setOpen(false)}>
          <X />
        </Button>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3 text-[13px]">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-lg border border-ai-border bg-ai-soft p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-ai">
                <Sparkles className="h-3.5 w-3.5" /> I can see the {ctx.label} screen
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Ask about prices, drawings, schedules, stock or quality. This prototype uses canned answers built from the demo data.</p>
            </div>
            <div className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested</div>
            <div className="flex flex-col gap-1.5">
              {ctx.prompts.map((p) => (
                <button key={p} onClick={() => ask(p)} className="rounded-md border px-2.5 py-2 text-left text-[13px] transition-colors hover:border-ai-border hover:bg-ai-soft">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn('flex gap-2', m.role === 'user' && 'justify-end')}>
            {m.role === 'ai' && (
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ai-soft text-ai">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}
            <div className={cn('max-w-[85%] rounded-lg px-3 py-2', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-ai-border bg-ai-soft/60')}>
              {m.role === 'ai' ? <MiniMarkdown text={m.text} /> : m.text}
              {m.streaming && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-ai align-middle" />}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-xs text-ai">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Reading {ctx.label.toLowerCase()} data…
          </div>
        )}
        {messages.length > 0 && !thinking && !messages.at(-1)?.streaming && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ctx.prompts
              .filter((p) => !messages.some((m) => m.text === p))
              .slice(0, 3)
              .map((p) => (
                <button key={p} onClick={() => ask(p)} className="rounded-full border px-2.5 py-1 text-xs hover:border-ai-border hover:bg-ai-soft">
                  {p}
                </button>
              ))}
          </div>
        )}
      </div>
      <form
        className="border-t p-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <div className="relative">
          <Textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ask(input)
              }
            }}
            placeholder="Ask Copilot…"
            className="min-h-[56px] resize-none pr-10"
            aria-label="Message Copilot"
          />
          <Button type="submit" size="icon-sm" variant="ai" className="absolute bottom-2 right-2" disabled={!input.trim() || thinking} aria-label="Send">
            <ArrowUp />
          </Button>
        </div>
        <div className="mt-1.5 text-2xs text-muted-foreground">AI answers can be wrong. Check critical values against the drawing.</div>
      </form>
    </aside>
  )
}
