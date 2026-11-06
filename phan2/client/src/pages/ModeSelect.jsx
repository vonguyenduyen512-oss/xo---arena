import { photoOf } from '../lib/avatar.js'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import { useApp } from '../store.jsx'

/* Màn hình 05 – Chọn chế độ chơi (dựng hoàn toàn bằng HTML/CSS/SVG, canvas 1280x720 tự co theo màn hình) */

const CSS = `
.ms-root{position:fixed;inset:0;overflow:hidden;background:#070a3a;font-family:'Baloo 2',system-ui,sans-serif;color:#fff}
.ms-stage{position:absolute;left:50%;top:50%;width:1280px;height:720px;transform-origin:center;overflow:hidden;user-select:none;
  background:
    radial-gradient(ellipse 520px 320px at 12% 38%,rgba(46,120,255,.38),transparent 70%),
    radial-gradient(ellipse 560px 340px at 88% 40%,rgba(190,60,255,.40),transparent 70%),
    radial-gradient(ellipse 600px 260px at 50% 0%,rgba(80,70,255,.55),transparent 75%),
    linear-gradient(180deg,#16147a 0%,#1c1590 38%,#2a1a9c 62%,#0f1458 100%)}
.ms-bgimg{position:absolute;inset:0;background:url(/img/bg.jpg) center/cover;opacity:.55;mix-blend-mode:screen;filter:saturate(1.2)}
.ms-moon{position:absolute;right:120px;top:-46px;width:190px;height:190px;border-radius:50%;
  background:radial-gradient(circle at 38% 38%,#c9d4ff,#7e8cff 55%,#4c46d8);opacity:.55;box-shadow:0 0 70px 10px rgba(140,150,255,.55)}
.ms-moon::after{content:"";position:absolute;inset:0;border-radius:50%;
  background:radial-gradient(circle at 60% 35%,rgba(60,50,160,.35) 0 10%,transparent 11%),radial-gradient(circle at 35% 65%,rgba(60,50,160,.3) 0 12%,transparent 13%)}
.ms-pagoda{position:absolute;bottom:150px;width:330px;height:300px;opacity:.5}
.ms-pagoda.l{left:-70px}.ms-pagoda.r{right:-70px;transform:scaleX(-1)}
.ms-floor{position:absolute;left:-10%;right:-10%;bottom:-40px;height:260px;transform:perspective(420px) rotateX(62deg);transform-origin:50% 100%;
  background:
    linear-gradient(rgba(120,140,255,.45) 1px,transparent 1px) 0 0/100% 46px,
    linear-gradient(90deg,rgba(120,140,255,.35) 1px,transparent 1px) 0 0/80px 100%,
    linear-gradient(180deg,rgba(40,30,160,0),rgba(70,50,220,.55));
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 55%);mask-image:linear-gradient(180deg,transparent,#000 55%)}
.ms-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(5,5,40,.55));pointer-events:none}
.ms-petal{position:absolute;width:14px;height:10px;border-radius:70% 0 70% 0;background:linear-gradient(135deg,#d9a0ff,#9a4dff);opacity:.7;
  animation:ms-fall linear infinite;filter:drop-shadow(0 0 4px rgba(190,120,255,.8))}
@keyframes ms-fall{from{transform:translate(0,-30px) rotate(0)}to{transform:translate(-90px,760px) rotate(540deg)}}

/* ----- thanh trên ----- */
.ms-abs{position:absolute}
.ms-me{left:14px;top:10px;width:330px;height:84px;display:flex;align-items:center;gap:12px;padding:0 10px 0 6px;text-align:left;
  background:linear-gradient(90deg,rgba(20,16,92,.75),rgba(20,16,92,0));border:0;border-radius:44px;color:#fff;cursor:pointer;font:inherit}
.ms-av{flex:none;width:72px;height:72px;border-radius:50%;padding:3px;background:linear-gradient(140deg,#7ad0ff,#b25bff 55%,#ff5fb0);
  box-shadow:0 0 18px rgba(150,110,255,.9)}
.ms-av>*{width:100%;height:100%;border-radius:50%;object-fit:cover;display:grid;place-items:center;font-size:36px;background:#241a78}
.ms-me-i{flex:1;min-width:0}
.ms-nm{font-weight:800;font-size:20px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ms-nm i{font-style:normal;color:#ffc93c;margin-left:6px;filter:drop-shadow(0 0 5px rgba(255,190,40,.9))}
.ms-lv{display:flex;align-items:center;gap:8px;margin-top:3px}.ms-lv b{font-size:17px}
.ms-xp{position:relative;flex:1;height:18px;border-radius:9px;background:rgba(10,12,70,.8);box-shadow:inset 0 0 0 1px rgba(120,170,255,.35);overflow:hidden}
.ms-xp>i{position:absolute;inset:0 auto 0 0;border-radius:9px;background:linear-gradient(180deg,#8fe9ff,#2f9bff 60%,#2a6cf0);box-shadow:0 0 10px rgba(80,190,255,.9)}
.ms-xp>span{position:absolute;inset:0;display:grid;place-items:center;font-size:12px;font-weight:700;text-shadow:0 1px 3px #000}
.ms-chip{top:15px;height:42px;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:0 5px;border-radius:22px;
  background:linear-gradient(180deg,#141c7a,#0c1257);border:1.5px solid rgba(110,150,255,.55);box-shadow:0 0 14px rgba(70,110,255,.5),inset 0 0 10px rgba(90,120,255,.25)}
.ms-chip .n{flex:1;text-align:center;font-weight:700;font-size:18px}
.ms-chip svg{flex:none;width:32px;height:32px}
.ms-plus{flex:none;width:30px;height:30px;border-radius:50%;border:0;padding:0;cursor:pointer;display:grid;place-items:center;color:#fff;font:800 24px/1 'Baloo 2',system-ui,sans-serif;
  background:radial-gradient(circle at 35% 30%,#7fe3ff,#1b8cf2 70%);box-shadow:0 0 10px rgba(60,170,255,.9);transition:transform .15s}
.ms-plus:hover{transform:scale(1.12)}
.ms-ibtn{top:12px;width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(120,160,255,.6);cursor:pointer;display:grid;place-items:center;position:absolute;
  background:linear-gradient(180deg,#151d86,#0b1060);box-shadow:0 0 14px rgba(80,120,255,.55),inset 0 0 10px rgba(90,120,255,.3);color:#fff;transition:transform .15s,box-shadow .15s}
.ms-ibtn:hover{transform:translateY(-2px);box-shadow:0 0 22px rgba(150,190,255,.95)}
.ms-ibtn svg{width:26px;height:26px}
.ms-ibtn em{position:absolute;right:-2px;top:-3px;width:18px;height:18px;border-radius:50%;background:#ff3b3b;font:800 12px/18px 'Baloo 2',system-ui,sans-serif;text-align:center;font-style:normal;box-shadow:0 0 8px #ff3b3b}
.ms-back{white-space:nowrap;left:18px;top:108px;width:152px;height:46px;display:flex;align-items:center;gap:14px;padding:0 18px 0 8px;border-radius:999px;cursor:pointer;color:#fff;font:700 18px 'Baloo 2',system-ui,sans-serif;
  background:linear-gradient(180deg,#1a24a0,#0c1262);border:1.5px solid rgba(120,160,255,.6);box-shadow:0 0 14px rgba(80,120,255,.5),inset 0 0 12px rgba(90,120,255,.3);transition:transform .15s}
.ms-back:hover{transform:translateX(-3px)}
.ms-back span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(80,130,255,.35)}

/* ----- logo + banner ----- */
.ms-logo{left:50%;top:58px;width:212px;height:106px;transform:translateX(-50%);overflow:hidden;filter:drop-shadow(0 0 18px rgba(90,160,255,.7))}
.ms-logo img{width:100%;display:block;margin-top:-14px}
.ms-banner{left:50%;top:158px;transform:translateX(-50%);width:372px;height:50px;display:flex;align-items:center;justify-content:center;gap:16px;
  font:800 25px 'Baloo 2',system-ui,sans-serif;letter-spacing:.3px;text-shadow:0 2px 8px rgba(0,0,0,.6);
  background:linear-gradient(90deg,#1a2bb8,#5a2bd8 50%,#1a2bb8);
  clip-path:polygon(22px 0,calc(100% - 22px) 0,100% 50%,calc(100% - 22px) 100%,22px 100%,0 50%);}
.ms-banner-w{left:50%;top:158px;transform:translateX(-50%);width:372px;height:50px;filter:drop-shadow(0 0 14px rgba(160,100,255,.9))}
.ms-banner-b{position:absolute;inset:0;background:linear-gradient(90deg,#4ea0ff,#c36bff 50%,#4ea0ff);clip-path:polygon(22px 0,calc(100% - 22px) 0,100% 50%,calc(100% - 22px) 100%,22px 100%,0 50%)}
.ms-banner-b+.ms-banner{inset:2.5px;width:auto;height:auto;left:2.5px;top:2.5px;right:2.5px;bottom:2.5px;transform:none;position:absolute;
  clip-path:polygon(20px 0,calc(100% - 20px) 0,100% 50%,calc(100% - 20px) 100%,20px 100%,0 50%)}
.ms-spark{color:#ffd24a;font-size:22px;filter:drop-shadow(0 0 6px #ffb800)}
.ms-slogan{right:26px;top:92px;width:230px;text-align:center;transform:rotate(-8deg);font:italic 700 27px/1.15 'Baloo 2',system-ui,sans-serif;text-shadow:0 0 14px rgba(160,200,255,.9),0 2px 6px #000}
.ms-slogan i{display:block;height:5px;margin:6px 10px 0 40px;border-radius:3px;background:linear-gradient(90deg,transparent,#c36bff,#fff);box-shadow:0 0 10px #c36bff}

/* ----- 2 thẻ lớn ----- */
.ms-cardw{position:absolute;top:215px;height:350px;filter:drop-shadow(0 0 16px var(--glow));transition:transform .2s,filter .2s;cursor:pointer;outline:0}
.ms-cardw:hover,.ms-cardw:focus-visible{transform:translateY(-5px);filter:drop-shadow(0 0 28px var(--glow)) brightness(1.08)}
.ms-cardw.blue{left:59px;width:563px;--glow:rgba(60,150,255,.95)}
.ms-cardw.pink{left:650px;width:568px;--glow:rgba(210,70,255,.95)}
.ms-card,.ms-card-in{position:absolute;clip-path:polygon(40px 0,calc(100% - 40px) 0,100% 40px,100% calc(100% - 40px),calc(100% - 40px) 100%,40px 100%,0 calc(100% - 40px),0 40px)}
.ms-card{inset:0}
.blue .ms-card{background:linear-gradient(135deg,#7fe6ff,#2f7dff 45%,#7fe6ff)}
.pink .ms-card{background:linear-gradient(135deg,#ff9ad9,#b13cff 45%,#ff7ac8)}
.ms-card-in{inset:3px;clip-path:polygon(38px 0,calc(100% - 38px) 0,100% 38px,100% calc(100% - 38px),calc(100% - 38px) 100%,38px 100%,0 calc(100% - 38px),0 38px)}
.blue .ms-card-in{background:radial-gradient(ellipse at 30% 40%,#2a5be0,#1a2a9c 55%,#141a78)}
.pink .ms-card-in{background:radial-gradient(ellipse at 70% 40%,#8a2fe0,#5a1fa8 55%,#3a1486)}
.ms-card-in::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.05) 0 2px,transparent 2px 26px)}
.ms-card-in::after{content:"";position:absolute;left:0;right:0;bottom:0;height:45%;background:linear-gradient(180deg,transparent,rgba(5,5,50,.55))}
.ms-char{position:absolute;pointer-events:none;-webkit-mask-image:linear-gradient(180deg,#000 80%,transparent);mask-image:linear-gradient(180deg,#000 80%,transparent)}
.ms-boy{left:-8px;top:-52px;width:360px}
.ms-girl{right:-14px;top:-52px;width:290px}
.ms-ttl{white-space:nowrap;position:absolute;font:italic 800 52px/1 'Baloo 2',system-ui,sans-serif;letter-spacing:.5px;transform:skewX(-6deg)}
.ms-ttl.w{left:150px;width:380px;text-align:center;top:176px;color:#fff;text-shadow:0 0 18px #3da2ff,0 0 6px #3da2ff,0 4px 0 rgba(10,20,90,.8)}
.ms-ttl.g{left:84px;top:176px;width:400px;text-align:center;background:linear-gradient(180deg,#fff4b0,#ffb43a 55%,#ff6a1a);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 10px rgba(255,150,60,.85)) drop-shadow(0 3px 0 rgba(90,20,60,.9))}
.ms-desc{white-space:nowrap;position:absolute;font:600 14px/1.35 'Baloo 2',system-ui,sans-serif;text-align:center;color:#e6ecff;text-shadow:0 1px 4px #000}
.ms-desc.a{left:158px;top:244px;width:262px}
.ms-desc.b{left:120px;top:244px;width:276px}
.ms-cta{white-space:nowrap;position:absolute;top:290px;height:50px;display:flex;align-items:center;justify-content:center;gap:12px;font:800 19px 'Baloo 2',system-ui,sans-serif;border-radius:999px;color:#fff;border:1.5px solid rgba(200,225,255,.7)}
.ms-cta.a{left:158px;width:262px;background:linear-gradient(180deg,#27a4ff,#1252d8);box-shadow:0 0 18px rgba(70,170,255,.9),inset 0 0 12px rgba(255,255,255,.3)}
.ms-cta.b{left:120px;width:276px;background:linear-gradient(180deg,#a04cf0,#5b1fc0);border-color:rgba(255,200,255,.7);box-shadow:0 0 18px rgba(200,90,255,.9),inset 0 0 12px rgba(255,255,255,.3)}
.ms-cta svg{width:22px;height:22px}
.ms-cta .ch{margin-left:6px;width:18px;height:18px}
.ms-xo{position:absolute;right:36px;top:22px;width:172px;filter:drop-shadow(0 0 14px rgba(60,200,255,.9))}
.ms-cup{position:absolute;left:197px;top:-2px;width:165px;filter:drop-shadow(0 0 18px rgba(255,190,60,.9))}
.ms-ring{position:absolute;right:30px;top:158px;width:112px;opacity:.95;filter:drop-shadow(0 0 14px rgba(255,70,70,.9))}

/* ----- 4 ô nhỏ ----- */
.ms-tile{position:absolute;top:579px;height:82px;box-sizing:border-box;display:flex;align-items:center;gap:14px;padding:0 16px 0 20px;border-radius:20px;cursor:pointer;color:#fff;text-align:left;
  font-family:inherit;transition:transform .18s,box-shadow .18s}
.ms-tile:hover,.ms-tile:focus-visible{transform:translateY(-4px);outline:0}
.ms-tile.b{background:linear-gradient(180deg,#1a2cc0,#0e1568);border:2px solid #4c86ff;box-shadow:0 0 16px rgba(70,130,255,.8),inset 0 0 16px rgba(80,120,255,.35)}
.ms-tile.b:hover{box-shadow:0 0 26px rgba(120,180,255,1),inset 0 0 18px rgba(100,150,255,.5)}
.ms-tile.p{background:linear-gradient(180deg,#5a24c8,#321078);border:2px solid #b45cff;box-shadow:0 0 16px rgba(190,90,255,.8),inset 0 0 16px rgba(190,90,255,.35)}
.ms-tile.p:hover{box-shadow:0 0 26px rgba(220,130,255,1),inset 0 0 18px rgba(200,120,255,.5)}
.ms-tile svg.ic{flex:none;width:44px;height:44px}
.ms-tile .t{flex:1;min-width:0;overflow:hidden}.ms-tile .t b{white-space:nowrap;display:block;font-size:18px;line-height:1.15}.ms-tile .t small{white-space:nowrap;display:block;font-size:12px;color:#cdd8ff;opacity:.9;font-weight:600}
.ms-tile .ch{flex:none;width:18px;height:18px;opacity:.9}
`

const svgp = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Chev = (p) => <svg viewBox="0 0 24 24" {...p}><path d="M9 5l7 7-7 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Gift = () => <svg viewBox="0 0 24 24" {...svgp}><rect x="3" y="9" width="18" height="12" rx="2" fill="currentColor" stroke="none" /><rect x="2" y="6" width="20" height="4" rx="1.5" fill="currentColor" stroke="none" /><path d="M12 6v15" stroke="#10156a" /><path d="M12 6C9 6 7 5 7.5 3.5S11 3 12 6zM12 6c3 0 5-1 4.5-2.5S13 3 12 6z" /></svg>
const Bell = () => <svg viewBox="0 0 24 24" {...svgp}><path d="M6 17V11a6 6 0 1112 0v6l2 2H4z" fill="currentColor" /><path d="M10 21a2 2 0 004 0" /></svg>
const Gear = () => <svg viewBox="0 0 24 24" {...svgp}><circle cx="12" cy="12" r="3.2" fill="#10156a" /><path d="M12 2.5l1.6 2.6 3-.8.8 3 3 .8-.8 3 2.6 1.6-2.6 1.6.8 3-3 .8-.8 3-3-.8L12 21.5l-1.6-2.6-3 .8-.8-3-3-.8.8-3L1.8 12.3l2.6-1.6-.8-3 3-.8.8-3 3 .8z" fill="currentColor" /><circle cx="12" cy="12" r="3.2" fill="#10156a" stroke="none" /></svg>
const Power = () => <svg viewBox="0 0 24 24" {...svgp} strokeWidth="2.8"><path d="M12 3v8" /><path d="M7 6.5a8 8 0 1010 0" /></svg>
const Users = () => <svg className="ic" viewBox="0 0 48 48"><g fill="#f4f8ff"><circle cx="24" cy="15" r="7" /><path d="M10 38c0-8 6-13 14-13s14 5 14 13z" /><circle cx="10" cy="19" r="5" opacity=".85" /><path d="M0 36c0-6 4-10 10-10 2 0 3 .3 4 .8-3 2-5 5-5 9.2z" opacity=".85" /><circle cx="38" cy="19" r="5" opacity=".85" /><path d="M48 36c0-6-4-10-10-10-2 0-3 .3-4 .8 3 2 5 5 5 9.2z" opacity=".85" /></g></svg>
const Robot = () => <svg className="ic" viewBox="0 0 48 48"><g fill="#f4f8ff"><rect x="9" y="14" width="30" height="24" rx="7" /><rect x="22" y="6" width="4" height="8" /><circle cx="24" cy="6" r="3" /><rect x="3" y="21" width="5" height="10" rx="2" /><rect x="40" y="21" width="5" height="10" rx="2" /></g><circle cx="18" cy="26" r="3.4" fill="#1a2cc0" /><circle cx="30" cy="26" r="3.4" fill="#1a2cc0" /><path d="M17 33h14" stroke="#1a2cc0" strokeWidth="2.4" strokeLinecap="round" /></svg>
const Star = () => <svg className="ic" viewBox="0 0 48 48"><defs><linearGradient id="msst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe36a" /><stop offset="1" stopColor="#f5a000" /></linearGradient></defs><path d="M24 3l6.3 13.4 14.7 1.8-10.9 10 2.9 14.5L24 35.3 10.9 42.7l2.9-14.5L3 18.2l14.7-1.8z" fill="url(#msst)" stroke="#ffcf3a" strokeWidth="1.5" strokeLinejoin="round" /></svg>
const Book = () => <svg className="ic" viewBox="0 0 48 48"><g fill="none" stroke="#f4f8ff" strokeWidth="3" strokeLinejoin="round"><path d="M4 9c7-2 14-1 20 3v28c-6-4-13-5-20-3z" /><path d="M44 9c-7-2-14-1-20 3v28c6-4 13-5 20-3z" /></g></svg>
const Bolt = () => <svg viewBox="0 0 24 24"><path d="M13.5 1L4 14h6l-1.5 9L20 9h-7z" fill="#ffe14a" stroke="#ffb800" strokeWidth="1" strokeLinejoin="round" /></svg>
const MiniCup = () => <svg viewBox="0 0 24 24"><path d="M6 3h12v6a6 6 0 01-12 0zM3 4h3v3a3 3 0 01-3-3zM21 4h-3v3a3 3 0 003-3zM11 15h2v3h-2zM8 19h8v2H8z" fill="#ffd24a" stroke="#d98a00" strokeWidth=".8" /></svg>
const Coin = () => <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#c97a00" /><circle cx="16" cy="16" r="13" fill="#f7b500" /><path d="M16 7.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L16 20.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" fill="#fff4b8" stroke="#d98a00" strokeWidth=".8" /></svg>
const Gem = () => <svg viewBox="0 0 32 32"><path d="M9 5h14l6 8-13 15L3 13z" fill="#27c6ff" /><path d="M9 5h14l6 8H3z" fill="#9aeaff" /><path d="M3 13h26L16 28z" fill="#1493e8" /><path d="M12 13l4 15 4-15M9 5l3 8M23 5l-3 8" fill="none" stroke="#e8fbff" strokeWidth="1" opacity=".85" /></svg>

const XO = () => (
  <svg className="ms-xo" viewBox="0 0 160 150" aria-hidden="true">
    <defs>
      <linearGradient id="msxa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bff4ff" /><stop offset="1" stopColor="#2aa0ff" /></linearGradient>
      <linearGradient id="msxb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b4fb0" /><stop offset="1" stopColor="#0f2f80" /></linearGradient>
    </defs>
    <g transform="translate(78 10)"><g transform="translate(5 8)" fill="url(#msxb)"><rect x="0" y="22" width="68" height="17" rx="5" transform="rotate(45 34 30)" /><rect x="0" y="22" width="68" height="17" rx="5" transform="rotate(-45 34 30)" /></g>
      <g fill="url(#msxa)"><rect x="0" y="22" width="68" height="17" rx="5" transform="rotate(45 34 30)" /><rect x="0" y="22" width="68" height="17" rx="5" transform="rotate(-45 34 30)" /></g></g>
    <ellipse cx="62" cy="108" rx="46" ry="26" fill="none" stroke="#1b4fb0" strokeWidth="20" transform="translate(0 8)" />
    <ellipse cx="62" cy="108" rx="46" ry="26" fill="none" stroke="url(#msxa)" strokeWidth="18" />
    <ellipse cx="62" cy="106" rx="46" ry="26" fill="none" stroke="#e6fbff" strokeWidth="2" opacity=".6" />
  </svg>
)

const Cup = () => (
  <svg className="ms-cup" viewBox="0 0 200 220" aria-hidden="true">
    <defs>
      <linearGradient id="msg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c77a00" /><stop offset=".35" stopColor="#ffe27a" /><stop offset=".6" stopColor="#ffc22e" /><stop offset="1" stopColor="#b86a00" /></linearGradient>
      <linearGradient id="msg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9a0" /><stop offset="1" stopColor="#e89400" /></linearGradient>
    </defs>
    <g fill="url(#msg2)" stroke="#c98200" strokeWidth="1">
      {[0, 1, 2, 3, 4].map((i) => <ellipse key={'l' + i} cx={34 + i * 3} cy={150 - i * 22} rx="6" ry="14" transform={`rotate(${-35 + i * -12} ${34 + i * 3} ${150 - i * 22})`} />)}
      {[0, 1, 2, 3, 4].map((i) => <ellipse key={'r' + i} cx={166 - i * 3} cy={150 - i * 22} rx="6" ry="14" transform={`rotate(${35 + i * 12} ${166 - i * 3} ${150 - i * 22})`} />)}
    </g>
    <path d="M62 50C40 50 38 88 66 96M138 50c22 0 24 38-4 46" fill="none" stroke="url(#msg1)" strokeWidth="9" strokeLinecap="round" />
    <path d="M60 46h80v44c0 28-18 44-40 48-22-4-40-20-40-48z" fill="url(#msg1)" stroke="#c98200" strokeWidth="1.5" />
    <path d="M70 52h14v70c-10-8-14-24-14-40z" fill="#fff6c8" opacity=".55" />
    <path d="M100 66l6 12 13 2-9.5 9 2.4 13-11.9-6.3-11.9 6.3 2.4-13-9.5-9 13-2z" fill="#fff4b8" opacity=".8" />
    <rect x="92" y="138" width="16" height="22" fill="url(#msg1)" />
    <path d="M70 160h60l8 18H62z" fill="url(#msg1)" stroke="#c98200" strokeWidth="1.5" />
    <rect x="56" y="178" width="88" height="14" rx="4" fill="url(#msg1)" stroke="#c98200" strokeWidth="1.5" />
    <path d="M72 46l8-22 10 12 10-18 10 18 10-12 8 22z" fill="url(#msg2)" stroke="#c98200" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="80" cy="24" r="3.5" fill="#ffe27a" /><circle cx="100" cy="18" r="3.5" fill="#ffe27a" /><circle cx="120" cy="24" r="3.5" fill="#ffe27a" />
  </svg>
)

const Ring = () => (
  <svg className="ms-ring" viewBox="0 0 120 80" aria-hidden="true">
    <defs><linearGradient id="msrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff9a9a" /><stop offset="1" stopColor="#e0202a" /></linearGradient></defs>
    <ellipse cx="60" cy="46" rx="48" ry="26" fill="none" stroke="#8a0f1c" strokeWidth="20" />
    <ellipse cx="60" cy="42" rx="48" ry="26" fill="none" stroke="url(#msrg)" strokeWidth="18" />
    <ellipse cx="60" cy="40" rx="48" ry="26" fill="none" stroke="#fff" strokeWidth="2" opacity=".5" />
  </svg>
)

const Pagoda = ({ className }) => (
  <svg className={'ms-pagoda ' + className} viewBox="0 0 330 300" aria-hidden="true">
    <g fill="#120d60">
      <path d="M40 300V150h250v150z" opacity=".8" />
      <path d="M0 160c60-10 90-40 110-70 20 30 50 60 110 70z" />
      <path d="M70 110c40-6 60-30 75-55 15 25 35 49 75 55z" />
      <path d="M110 58c25-4 37-18 45-34 8 16 20 30 45 34z" />
      <rect x="120" y="160" width="6" height="140" /><rect x="190" y="160" width="6" height="140" />
    </g>
  </svg>
)

function Avatar({ avatar }) {
  return photoOf(avatar) ? <img src={photoOf(avatar)} alt="" draggable="false" /> : <span>{avatar}</span>
}

function useFit(w, h) {
  const calc = () => Math.min(window.innerWidth / w, window.innerHeight / h)
  const [s, setS] = useState(calc)
  useEffect(() => {
    const f = () => setS(calc())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return s
}

const PETALS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 83 + 40) % 1300, delay: -((i * 1.7) % 14), dur: 11 + (i % 5) * 2.4, s: 0.7 + (i % 4) * 0.25,
}))

export default function ModeSelect() {
  const nav = useNavigate()
  const { user, logout } = useApp()
  const [toast, setToast] = useToast()
  const scale = useFit(1280, 720)
  if (!user) return null
  const soon = (n) => () => setToast(`${n}: sắp ra mắt`)
  const pct = Math.max(0, Math.min(100, Math.round((user.exp / user.expMax) * 100)))
  const fmt = (n) => Number(n).toLocaleString('en-US')
  const key = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() } }
  const stop = (fn) => (e) => { e.stopPropagation(); fn() }

  const goNormal = () => nav('/lobby')
  const goTour = soon('Giải đấu')

  const tiles = [
    { k: 'b', x: 38, w: 304, icon: <Users />, t: 'Chơi cùng bạn bè', s: 'Tạo phòng hoặc tham gia phòng', go: () => nav('/create-room') },
    { k: 'b', x: 361, w: 265, icon: <Robot />, t: 'Chơi với AI', s: 'Luyện tập kỹ năng', go: () => nav('/game/AI') },
    { k: 'p', x: 646, w: 280, icon: <Users />, t: 'Chơi 2 người', s: 'Hai người chung một máy', go: () => nav('/game/LOCAL') },
    { k: 'p', x: 945, w: 299, icon: <Book />, t: 'Hướng dẫn chơi', s: 'Tìm hiểu cách chơi', go: () => nav('/how-to-play') },
  ]

  return (
    <div className="ms-root">
      <style>{CSS}</style>
      <div className="ms-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {/* nền */}
        <div className="ms-bgimg" /><div className="ms-moon" />
        <Pagoda className="l" /><Pagoda className="r" />
        <div className="ms-floor" /><div className="ms-vig" />
        {PETALS.map((p, i) => <span key={i} className="ms-petal" style={{ left: p.left, top: 0, animationDuration: p.dur + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />)}

        {/* thanh trên */}
        <button className="ms-abs ms-me" onClick={() => nav('/profile')} aria-label="Hồ sơ">
          <span className="ms-av"><Avatar avatar={user.avatar} /></span>
          <span className="ms-me-i">
            <div className="ms-nm">{user.name}<i>♛</i></div>
            <div className="ms-lv"><b>Lv.{user.level}</b><div className="ms-xp"><i style={{ width: pct + '%' }} /><span>{fmt(user.exp)} / {fmt(user.expMax)}</span></div></div>
          </span>
        </button>
        <div className="ms-abs ms-chip" style={{ left: 402, width: 168 }}><Coin /><span className="n">{fmt(user.coins)}</span><button className="ms-plus" onClick={soon('Nạp xu')} aria-label="Nạp xu">+</button></div>
        <div className="ms-abs ms-chip" style={{ left: 584, width: 152 }}><Gem /><span className="n">{fmt(user.gems)}</span><button className="ms-plus" onClick={soon('Nạp kim cương')} aria-label="Nạp kim cương">+</button></div>
        <button className="ms-ibtn" style={{ left: 1048 }} onClick={soon('Quà tặng')} aria-label="Quà tặng"><Gift /><em>!</em></button>
        <button className="ms-ibtn" style={{ left: 1104 }} onClick={soon('Thông báo')} aria-label="Thông báo"><Bell /><em>!</em></button>
        <button className="ms-ibtn" style={{ left: 1160 }} onClick={() => nav('/settings')} aria-label="Cài đặt"><Gear /></button>
        <button className="ms-ibtn" style={{ left: 1216 }} onClick={() => { logout(); nav('/login') }} aria-label="Đăng xuất"><Power /></button>
        <button className="ms-abs ms-back" onClick={() => nav('/home')}><span><Chev width="18" height="18" style={{ transform: 'scaleX(-1)' }} /></span>Quay lại</button>

        {/* logo + tiêu đề + slogan */}
        <div className="ms-abs ms-logo"><img src="/img/logo.png" alt="X-O Arena" draggable="false" /></div>
        <div className="ms-abs ms-banner-w"><div className="ms-banner-b" /><div className="ms-banner" style={{ background: 'linear-gradient(90deg,#1a2bb8,#4a27c8 50%,#1a2bb8)' }}><span className="ms-spark">✦</span>Chọn chế độ chơi<span className="ms-spark">✦</span></div></div>
        <div className="ms-abs ms-slogan">Chơi hết mình<br />Thắng thật đã!<i /></div>

        {/* thẻ Chơi Thường */}
        <div className="ms-cardw blue" role="button" tabIndex={0} onClick={goNormal} onKeyDown={key(goNormal)} aria-label="Chơi Thường">
          <div className="ms-card" /><div className="ms-card-in" />
          <img className="ms-char ms-boy" src="/img/boy.png" alt="" draggable="false" />
          <XO />
          <div className="ms-ttl w">Chơi Thường</div>
          <div className="ms-desc a">Tham gia các trận đấu nhanh chóng<br />với người chơi khác</div>
          <button className="ms-cta a" onClick={stop(goNormal)}><Bolt />Bắt đầu ngay<Chev className="ch" /></button>
        </div>

        {/* thẻ Giải Đấu */}
        <div className="ms-cardw pink" role="button" tabIndex={0} onClick={goTour} onKeyDown={key(goTour)} aria-label="Giải Đấu">
          <div className="ms-card" /><div className="ms-card-in" />
          <Cup /><Ring />
          <img className="ms-char ms-girl" src="/img/girl.png" alt="" draggable="false" />
          <div className="ms-ttl g">Giải Đấu</div>
          <div className="ms-desc b">Tham gia giải đấu, tranh tài<br />nhận phần thưởng hấp dẫn</div>
          <button className="ms-cta b" onClick={stop(goTour)}><MiniCup />Tham gia ngay<Chev className="ch" /></button>
        </div>

        {/* 4 ô chức năng */}
        {tiles.map((t) => (
          <button key={t.t} className={'ms-tile ' + t.k} style={{ left: t.x, width: t.w }} onClick={t.go}>
            {t.icon}<span className="t"><b>{t.t}</b><small>{t.s}</small></span><Chev className="ch" />
          </button>
        ))}
      </div>
      {toast}
    </div>
  )
}