import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import './style.css';

function Popup() {
  const [count, setCount] = useState(0);
  return (
    <main>
      <h1>FunGame Helper</h1>
      <p>从一个小想法开始。</p>
      <button onClick={() => setCount(count + 1)}>点击次数：{count}</button>
    </main>
  );
}
const root = document.getElementById('root');
if (!root) {
  throw new Error('缺少应用挂载节点 #root');
}
createRoot(root).render(<Popup />);
