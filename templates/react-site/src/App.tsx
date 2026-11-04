import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './components/ui/button';
export default function App() {
  const [count, setCount] = useState(0);
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 px-6">
      <Sparkles size={32} />
      <p className="text-sm text-slate-500">FUN GAME · NEW IDEA</p>
      <h1 className="text-4xl font-bold tracking-tight">从一个小想法开始。</h1>
      <p className="text-slate-600">
        你的网站已经准备好了，接下来让它变得有趣。
      </p>
      <Button onClick={() => setCount(count + 1)}>试试交互 · {count}</Button>
    </main>
  );
}
