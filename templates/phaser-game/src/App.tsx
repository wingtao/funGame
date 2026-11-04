import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
class MainScene extends Phaser.Scene {
  create() {
    let score = 0;
    const label = this.add.text(24, 24, '点击圆球得分：0', {
      fontSize: '24px',
      color: '#ffffff',
    });
    const ball = this.add
      .circle(400, 260, 36, 0x38bdf8)
      .setInteractive({ useHandCursor: true });
    ball.on('pointerdown', () => {
      score += 1;
      label.setText(`点击圆球得分：${score}`);
      ball.setPosition(
        Phaser.Math.Between(50, 750),
        Phaser.Math.Between(100, 450),
      );
    });
  }
}
export default function App() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container.current,
      width: 800,
      height: 500,
      backgroundColor: '#0f172a',
      scene: MainScene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    return () => game.destroy(true);
  }, []);
  return (
    <main>
      <h1>FunGame · 点击圆球</h1>
      <div className="game" ref={container} />
      <p>点击蓝色圆球，开始你的第一个小游戏。</p>
    </main>
  );
}
