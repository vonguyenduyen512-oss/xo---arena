import { photoOf } from '../lib/avatar.js'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Layout.jsx'
import { useApp } from '../store.jsx'

/* Màn hình 06 – Sảnh chờ (dựng hoàn toàn bằng HTML/CSS/SVG, canvas 1280x720 tự co theo màn hình)
   Backend: thay state msgs / opponent bằng dữ liệu Socket.IO (room:updated, chat:message). */

const F = "'Baloo 2',system-ui,sans-serif"
const CSS = `
.lb-root{position:fixed;inset:0;overflow:hidden;background:#070a3a;font-family:${F};color:#fff}
.lb-stage{position:absolute;left:50%;top:50%;width:1280px;height:720px;transform-origin:center;overflow:hidden;user-select:none;
  background:
    radial-gradient(ellipse 520px 360px at 12% 45%,rgba(46,120,255,.38),transparent 70%),
    radial-gradient(ellipse 560px 360px at 88% 45%,rgba(190,60,255,.40),transparent 70%),
    radial-gradient(ellipse 600px 260px at 50% 0%,rgba(80,70,255,.55),transparent 75%),
    linear-gradient(180deg,#16147a 0%,#1c1590 38%,#2a1a9c 62%,#0f1458 100%)}
.lb-bgimg{position:absolute;inset:0;background:url(/img/bg.jpg) center/cover;opacity:.5;mix-blend-mode:screen;filter:saturate(1.2)}
.lb-moon{position:absolute;right:300px;top:-60px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle at 38% 38%,#c9d4ff,#7e8cff 55%,#4c46d8);opacity:.4;box-shadow:0 0 70px 10px rgba(140,150,255,.5)}
.lb-floor{position:absolute;left:-10%;right:-10%;bottom:-40px;height:260px;transform:perspective(420px) rotateX(62deg);transform-origin:50% 100%;
  background:linear-gradient(rgba(120,140,255,.4) 1px,transparent 1px) 0 0/100% 46px,linear-gradient(90deg,rgba(120,140,255,.3) 1px,transparent 1px) 0 0/80px 100%,linear-gradient(180deg,rgba(40,30,160,0),rgba(70,50,220,.5));
  -webkit-mask-image:linear-gradient(180deg,transparent,#000 55%);mask-image:linear-gradient(180deg,transparent,#000 55%)}
.lb-vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(5,5,40,.55));pointer-events:none}
.lb-petal{position:absolute;width:14px;height:10px;border-radius:70% 0 70% 0;background:linear-gradient(135deg,#d9a0ff,#9a4dff);opacity:.65;animation:lb-fall linear infinite;filter:drop-shadow(0 0 4px rgba(190,120,255,.8))}
@keyframes lb-fall{from{transform:translate(0,-30px) rotate(0)}to{transform:translate(-90px,760px) rotate(540deg)}}
.lb-a{position:absolute}
.lb-char{position:absolute;pointer-events:none;-webkit-mask-image:linear-gradient(180deg,#000 78%,transparent);mask-image:linear-gradient(180deg,#000 78%,transparent)}

/* ----- thanh trên ----- */
.lb-me{left:14px;top:10px;width:330px;height:84px;display:flex;align-items:center;gap:12px;padding:0 10px 0 6px;text-align:left;border:0;border-radius:44px;color:#fff;cursor:pointer;font:inherit;
  background:linear-gradient(90deg,rgba(20,16,92,.7),rgba(20,16,92,0))}
.lb-av{flex:none;width:72px;height:72px;border-radius:50%;padding:3px;background:linear-gradient(140deg,#7ad0ff,#b25bff 55%,#ff5fb0);box-shadow:0 0 18px rgba(150,110,255,.9)}
.lb-av>*{width:100%;height:100%;border-radius:50%;object-fit:cover;display:grid;place-items:center;font-size:36px;background:#241a78}
.lb-me-i{flex:1;min-width:0}
.lb-nm{font-weight:800;font-size:20px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-nm i{font-style:normal;color:#ffc93c;margin-left:6px;filter:drop-shadow(0 0 5px rgba(255,190,40,.9))}
.lb-lv{display:flex;align-items:center;gap:8px;margin-top:3px}.lb-lv b{font-size:17px}
.lb-xp{position:relative;flex:1;height:18px;border-radius:9px;background:rgba(10,12,70,.8);box-shadow:inset 0 0 0 1px rgba(120,170,255,.35);overflow:hidden}
.lb-xp>i{position:absolute;inset:0 auto 0 0;border-radius:9px;background:linear-gradient(180deg,#8fe9ff,#2f9bff 60%,#2a6cf0);box-shadow:0 0 10px rgba(80,190,255,.9)}
.lb-xp>span{position:absolute;inset:0;display:grid;place-items:center;font-size:12px;font-weight:700;text-shadow:0 1px 3px #000}
.lb-chip{top:15px;height:42px;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:0 5px;border-radius:22px;background:linear-gradient(180deg,#141c7a,#0c1257);border:1.5px solid rgba(110,150,255,.55);box-shadow:0 0 14px rgba(70,110,255,.5),inset 0 0 10px rgba(90,120,255,.25)}
.lb-chip .n{flex:1;text-align:center;font-weight:700;font-size:18px}.lb-chip svg{flex:none;width:32px;height:32px}
.lb-plus{flex:none;width:30px;height:30px;border-radius:50%;border:0;padding:0;cursor:pointer;display:grid;place-items:center;color:#fff;font:800 24px/1 ${F};background:radial-gradient(circle at 35% 30%,#7fe3ff,#1b8cf2 70%);box-shadow:0 0 10px rgba(60,170,255,.9);transition:transform .15s}
.lb-plus:hover{transform:scale(1.12)}
.lb-ibtn{position:absolute;top:12px;width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(120,160,255,.6);cursor:pointer;display:grid;place-items:center;background:linear-gradient(180deg,#151d86,#0b1060);box-shadow:0 0 14px rgba(80,120,255,.55),inset 0 0 10px rgba(90,120,255,.3);color:#fff;transition:transform .15s,box-shadow .15s}
.lb-ibtn:hover{transform:translateY(-2px);box-shadow:0 0 22px rgba(150,190,255,.95)}.lb-ibtn svg{width:25px;height:25px}
.lb-ibtn em{position:absolute;right:-2px;top:-3px;width:18px;height:18px;border-radius:50%;background:#ff3b3b;font:800 12px/18px ${F};text-align:center;font-style:normal;box-shadow:0 0 8px #ff3b3b}
.lb-logo{left:892px;top:30px;width:190px;filter:drop-shadow(0 0 16px rgba(90,160,255,.7))}

/* ----- menu trái ----- */
.lb-side{left:12px;top:171px;width:166px;padding:8px 0;border-radius:18px;background:linear-gradient(180deg,rgba(14,18,100,.78),rgba(18,14,90,.7));border:1.5px solid rgba(110,150,255,.45);box-shadow:0 0 16px rgba(70,110,255,.4);backdrop-filter:blur(3px)}
.lb-it{display:flex;align-items:center;gap:10px;width:100%;height:47px;padding:0 12px;border:0;background:transparent;color:#fff;font:700 14.5px ${F};cursor:pointer;text-align:left;white-space:nowrap;transition:background .15s}
.lb-it:hover{background:rgba(120,160,255,.18)}.lb-it svg{flex:none;width:27px;height:27px}
.lb-act{left:12px;top:114px;width:166px;height:48px;display:flex;align-items:center;gap:12px;padding:0 12px;border-radius:14px;font:800 16px ${F};white-space:nowrap;
  background:linear-gradient(180deg,#3f6dff,#1b2fc8);border:2px solid #9fd0ff;box-shadow:0 0 20px rgba(90,170,255,.95),inset 0 0 12px rgba(255,255,255,.3)}
.lb-act svg{width:30px;height:30px}

/* ----- phòng ----- */
.lb-roomw{left:302px;top:91px;width:530px;height:90px;filter:drop-shadow(0 0 14px rgba(150,110,255,.9))}
.lb-hex,.lb-hex-in{position:absolute;clip-path:polygon(30px 0,calc(100% - 30px) 0,100% 50%,calc(100% - 30px) 100%,30px 100%,0 50%)}
.lb-hex{inset:0;background:linear-gradient(90deg,#5ea0ff,#c36bff 50%,#5ea0ff)}
.lb-hex-in{inset:2.5px;background:linear-gradient(180deg,#1a2096,#0f1470);clip-path:polygon(28px 0,calc(100% - 28px) 0,100% 50%,calc(100% - 28px) 100%,28px 100%,0 50%)}
.lb-room-t{position:absolute;left:0;right:0;top:8px;display:flex;align-items:center;justify-content:center;gap:12px;font:800 25px ${F};white-space:nowrap}
.lb-room-t svg{width:34px;height:34px}
.lb-badge{padding:0 14px;height:28px;display:grid;place-items:center;border-radius:9px;font:800 16px ${F};background:linear-gradient(180deg,#6f3fe0,#4326a8);border:1.5px solid #b78cff}
.lb-room-s{position:absolute;left:0;right:0;bottom:11px;display:flex;align-items:center;justify-content:center;gap:16px;font:600 14px ${F};white-space:nowrap}
.lb-room-s span{display:flex;align-items:center;gap:8px}.lb-room-s svg{width:22px;height:22px}.lb-room-s u{width:1px;height:20px;background:rgba(190,200,255,.5)}

/* ----- thẻ người chơi ----- */
.lb-pc{top:214px;height:264px;box-sizing:border-box;border-radius:22px;display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:26px}
.lb-pc.me{left:363px;width:189px;background:linear-gradient(180deg,rgba(40,34,170,.92),rgba(24,20,120,.92));border:2.5px solid #6fb0ff;box-shadow:0 0 22px rgba(90,160,255,.95),inset 0 0 18px rgba(100,150,255,.35)}
.lb-pc.op{left:610px;width:182px;background:linear-gradient(180deg,rgba(60,32,150,.9),rgba(36,20,100,.92));border:2.5px solid #b07cff;box-shadow:0 0 22px rgba(190,100,255,.9),inset 0 0 18px rgba(180,100,255,.3)}
.lb-crown{position:absolute;top:-24px;left:50%;transform:translateX(-50%);width:50px;filter:drop-shadow(0 0 8px rgba(255,190,40,.9))}
.lb-pav{width:120px;height:120px;border-radius:50%;padding:4px;background:linear-gradient(140deg,#8fd8ff,#b25bff 55%,#ff6ab8);box-shadow:0 0 20px rgba(160,120,255,.9)}
.lb-pav>*{width:100%;height:100%;border-radius:50%;object-fit:cover;display:grid;place-items:center;font-size:64px;background:#241a78}
.lb-pav.ghost{background:linear-gradient(140deg,#8a86d8,#6a56b8);box-shadow:0 0 14px rgba(160,140,255,.5)}
.lb-pav.ghost>*{background:#4a4590;color:#cfd0f4}
.lb-pn{margin-top:12px;font:800 19px ${F};white-space:nowrap}.lb-pn i{font-style:normal;color:#ffc93c;margin-left:5px}
.lb-pl{font:600 14px ${F};color:#d9defc;margin-top:-2px}
.lb-ready{margin-top:8px;display:flex;align-items:center;gap:8px}
.lb-rb{display:flex;align-items:center;gap:8px;height:30px;padding:0 16px;border:0;border-radius:15px;cursor:pointer;color:#fff;font:800 14px ${F};background:linear-gradient(180deg,#17c964,#0a8f45);box-shadow:0 0 12px rgba(40,220,120,.7)}
.lb-rb.off{background:linear-gradient(180deg,#8a8fb8,#5b5f88);box-shadow:none}
.lb-rb i{width:9px;height:9px;border-radius:50%;background:#baffd2;box-shadow:0 0 6px #7dffb0}
.lb-ck{width:30px;height:30px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;background:linear-gradient(180deg,#8f9cff,#4b57d8);box-shadow:0 0 10px rgba(120,140,255,.8)}
.lb-wait{margin-top:12px;white-space:nowrap;font:600 13px ${F};color:#e0e6ff}
.lb-inv{margin-top:10px;height:34px;padding:0 14px;display:flex;align-items:center;gap:8px;border-radius:12px;cursor:pointer;color:#fff;font:700 14px ${F};white-space:nowrap;
  background:linear-gradient(180deg,#2c3ccc,#1a2490);border:1.5px solid #6f9cff;box-shadow:0 0 12px rgba(80,130,255,.7)}
.lb-inv svg{width:22px;height:22px}
.lb-vs{z-index:3;left:546px;top:276px;width:100px;overflow:visible;filter:drop-shadow(0 0 14px rgba(255,170,30,.95))}

/* ----- nút dưới ----- */
.lb-btn{position:absolute;display:flex;align-items:center;justify-content:center;gap:12px;color:#fff;cursor:pointer;white-space:nowrap;font:700 18px ${F};transition:transform .18s,box-shadow .18s}
.lb-btn:hover{transform:translateY(-3px)}.lb-btn svg{width:30px;height:30px}
.lb-sec{top:564px;height:52px;border-radius:16px;background:linear-gradient(180deg,#2a2cc0,#17197f);border:2px solid #7f86ff;box-shadow:0 0 16px rgba(110,120,255,.8),inset 0 0 14px rgba(130,140,255,.3)}
.lb-sec:hover{box-shadow:0 0 26px rgba(150,170,255,1)}
.lb-go{left:464px;top:552px;width:311px;height:72px;border-radius:20px;font:800 24px ${F};
  background:linear-gradient(180deg,#ffc83a,#ff8a00 55%,#f06400);border:3px solid #ffe08a;box-shadow:0 0 26px rgba(255,160,30,.95),inset 0 0 16px rgba(255,255,255,.4);text-shadow:0 2px 0 rgba(120,50,0,.7)}
.lb-go:hover{box-shadow:0 0 38px rgba(255,190,60,1),inset 0 0 16px rgba(255,255,255,.5)}.lb-go svg{width:44px;height:44px}

/* ----- chat ----- */
.lb-chat{left:1016px;top:180px;width:252px;height:441px;box-sizing:border-box;display:flex;flex-direction:column;border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,rgba(26,22,130,.88),rgba(20,16,100,.9));border:2px solid #7f86ff;box-shadow:0 0 18px rgba(120,120,255,.8)}
.lb-ch{display:flex;align-items:center;gap:10px;height:46px;padding:0 14px;font:800 18px ${F};background:rgba(70,60,200,.35);border-bottom:1px solid rgba(140,150,255,.4)}
.lb-ch svg{width:26px;height:26px}
.lb-ml{flex:1;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:12px}
.lb-ml::-webkit-scrollbar{width:0}
.lb-m{display:flex;gap:9px;align-items:flex-start}
.lb-m .a{flex:none;width:36px;height:36px;border-radius:50%;padding:2px;background:linear-gradient(140deg,#8fd8ff,#b25bff)}
.lb-m .a>*{width:100%;height:100%;border-radius:50%;object-fit:cover;display:grid;place-items:center;font-size:18px;background:#2a2090}
.lb-m .c{flex:1;min-width:0}.lb-m .c small{display:block;font:700 12px ${F};color:#c9d0ff}
.lb-m .c p{margin:2px 0 0;display:inline-block;max-width:100%;padding:3px 10px;border-radius:10px;background:rgba(110,120,255,.35);font:600 13px/1.3 ${F};word-break:break-word}
.lb-m time{flex:none;font:600 11px ${F};color:#aab2ef;align-self:flex-end}
.lb-in{display:flex;align-items:center;gap:8px;padding:8px 10px;border-top:1px solid rgba(140,150,255,.4)}
.lb-em{flex:none;width:34px;height:34px;border-radius:50%;border:0;font-size:20px;cursor:pointer;background:linear-gradient(180deg,#4a52d8,#2a2fa8)}
.lb-in input{flex:1;min-width:0;height:34px;box-sizing:border-box;padding:0 12px;border-radius:10px;border:1.5px solid rgba(130,140,255,.6);outline:0;color:#fff;font:600 13px ${F};background:rgba(10,12,80,.7)}
.lb-in input::placeholder{color:#9aa3e8}.lb-in input:focus{border-color:#9fd0ff;box-shadow:0 0 10px rgba(120,190,255,.7)}
.lb-send{flex:none;width:36px;height:34px;border-radius:10px;border:0;cursor:pointer;display:grid;place-items:center;background:linear-gradient(180deg,#5fa8ff,#7b45ee);box-shadow:0 0 12px rgba(120,130,255,.8)}
.lb-send svg{width:20px;height:20px}

/* ----- thanh dưới ----- */
.lb-bar{top:661px;height:40px;box-sizing:border-box;display:flex;align-items:center;gap:8px;padding:0 14px;border-radius:20px;white-space:nowrap;font:600 13px ${F};
  background:linear-gradient(180deg,rgba(24,28,150,.85),rgba(16,18,100,.88));border:1.5px solid rgba(120,150,255,.6);box-shadow:0 0 14px rgba(80,120,255,.5)}
.lb-bar svg{flex:none;width:26px;height:26px}.lb-bar b{color:#ffd24a}
.lb-bars{display:flex;align-items:flex-end;gap:2px;height:16px}.lb-bars i{width:4px;border-radius:1px;background:#3dff8a;box-shadow:0 0 5px #3dff8a}
`

const sp = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Home = () => <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2.5L1.5 12h3v9h5.5v-6h4v6h5.5v-9h3z" /></svg>
const Plus = () => <svg viewBox="0 0 24 24" fill="#e8eeff"><path d="M3 5h12l3 3v3h-2V9h-3V6H5v12h5v2H3z" /><path d="M17 13h2v3h3v2h-3v3h-2v-3h-3v-2h3z" /></svg>
const Join = () => <svg viewBox="0 0 24 24" fill="#e8eeff"><path d="M4 3h10v6h-2V5H6v14h6v-4h2v6H4z" /><path d="M11 11h6V8l5 4-5 4v-3h-6z" /></svg>
const Medal = () => <svg viewBox="0 0 24 24" fill="#e8eeff"><path d="M8 2h8l-2 6h-4z" opacity=".8" /><circle cx="12" cy="15" r="6.5" /><path d="M12 11.5l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#2a2fa8" /></svg>
const User = () => <svg viewBox="0 0 24 24" fill="#e8eeff"><circle cx="12" cy="8" r="4.5" /><path d="M3.5 21c0-5 4-8 8.500-8s8.500 3 8.500 8z" /></svg>
const Gear = () => <svg viewBox="0 0 24 24" {...sp}><path d="M12 2.5l1.6 2.6 3-.8.8 3 3 .8-.8 3 2.6 1.6-2.6 1.6.8 3-3 .8-.8 3-3-.8L12 21.5l-1.6-2.6-3 .8-.8-3-3-.8.8-3L1.8 12.3l2.6-1.6-.8-3 3-.8.8-3 3 .8z" fill="currentColor" /><circle cx="12" cy="12" r="3.2" fill="#10156a" stroke="none" /></svg>
const Exit = () => <svg viewBox="0 0 24 24" fill="#e8eeff"><path d="M5 2h9v6h-2V4H7v16h5v-4h2v6H5z" /><path d="M13 11h6V8l5 4-5 4v-3h-6z" transform="translate(-2 0)" /></svg>
const Gift = () => <svg viewBox="0 0 24 24" {...sp}><rect x="3" y="9" width="18" height="12" rx="2" fill="currentColor" stroke="none" /><rect x="2" y="6" width="20" height="4" rx="1.5" fill="currentColor" stroke="none" /><path d="M12 6v15" stroke="#10156a" /><path d="M12 6C9 6 7 5 7.5 3.5S11 3 12 6zM12 6c3 0 5-1 4.5-2.5S13 3 12 6z" /></svg>
const Bell = () => <svg viewBox="0 0 24 24" {...sp}><path d="M6 17V11a6 6 0 1112 0v6l2 2H4z" fill="currentColor" /><path d="M10 21a2 2 0 004 0" /></svg>
const Coin = () => <svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#c97a00" /><circle cx="16" cy="16" r="13" fill="#f7b500" /><path d="M16 7.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L16 20.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" fill="#fff4b8" stroke="#d98a00" strokeWidth=".8" /></svg>
const Gem = () => <svg viewBox="0 0 32 32"><path d="M9 5h14l6 8-13 15L3 13z" fill="#27c6ff" /><path d="M9 5h14l6 8H3z" fill="#9aeaff" /><path d="M3 13h26L16 28z" fill="#1493e8" /><path d="M12 13l4 15 4-15M9 5l3 8M23 5l-3 8" fill="none" stroke="#e8fbff" strokeWidth="1" opacity=".85" /></svg>
const Users = () => <svg viewBox="0 0 48 48" fill="#f4f8ff"><circle cx="24" cy="15" r="7" /><path d="M10 38c0-8 6-13 14-13s14 5 14 13z" /><circle cx="9" cy="19" r="5" opacity=".85" /><path d="M0 36c0-6 4-10 9-10 2 0 3 .3 4 .8-3 2-5 5-5 9.2z" opacity=".85" /><circle cx="39" cy="19" r="5" opacity=".85" /><path d="M48 36c0-6-4-10-9-10-2 0-3 .3-4 .8 3 2 5 5 5 9.2z" opacity=".85" /></svg>
const Pad = () => <svg viewBox="0 0 24 24" fill="#e8eeff"><path d="M7 6h10a5 5 0 015 5v3a4 4 0 01-7 2.600L14 15h-4l-1 1.600A4 4 0 012 14v-3a5 5 0 015-5z" /><path d="M7 9v1.500H5.500v1.500H7v1.500h1.500V12H10v-1.500H8.500V9z" fill="#1a2096" /><circle cx="16" cy="10" r="1.200" fill="#1a2096" /><circle cx="18.500" cy="12" r="1.200" fill="#1a2096" /></svg>
const Lock = () => <svg viewBox="0 0 24 24" fill="#e8eeff"><path d="M7 10V7a5 5 0 0110 0v3h1.500a1.500 1.500 0 011.500 1.500v9a1.500 1.500 0 01-1.500 1.500h-13A1.500 1.500 0 014 20.500v-9A1.500 1.500 0 015.500 10zm2 0h6V7a3 3 0 00-6 0z" /></svg>
const Bolt = () => <svg viewBox="0 0 24 24"><path d="M13.500 1L4 14h6l-1.500 9L20 9h-7z" fill="#ffe14a" stroke="#ffb800" strokeWidth="1" strokeLinejoin="round" /></svg>
const Swords = () => <svg viewBox="0 0 48 48"><g stroke="#fff" strokeLinecap="round"><path d="M9 9l24 24M39 9L15 33" strokeWidth="5" /><path d="M6 15l9 9M42 15l-9 9" strokeWidth="5" /><path d="M31 35l9 9M17 35l-9 9" strokeWidth="6" /></g><g stroke="#cfe3ff" strokeLinecap="round"><path d="M9 9l24 24M39 9L15 33" strokeWidth="2.200" /></g></svg>
const PlusUser = () => <svg viewBox="0 0 24 24" fill="#fff"><circle cx="9" cy="8" r="4.200" /><path d="M1.500 20c0-4.500 3.300-7 7.500-7s7.500 2.500 7.500 7z" /><path d="M18 8h2v3h3v2h-3v3h-2v-3h-3v-2h3z" /></svg>
const Door = () => <svg viewBox="0 0 24 24" fill="#fff"><path d="M4 3h10v6h-2V5H6v14h6v-4h2v6H4z" /><path d="M11 11h6V8l5 4-5 4v-3h-6z" /></svg>
const Chat = () => <svg viewBox="0 0 24 24" fill="#e8eeff"><path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2h-8l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z" /><circle cx="8" cy="11" r="1.400" fill="#1a2096" /><circle cx="12" cy="11" r="1.400" fill="#1a2096" /><circle cx="16" cy="11" r="1.400" fill="#1a2096" /></svg>
const Plane = () => <svg viewBox="0 0 24 24" fill="#fff"><path d="M2 3l20 9-20 9 3-9zM5 12l-1.500 6L17 12 3.500 6z" /></svg>
const Mega = () => <svg viewBox="0 0 24 24"><path d="M3 9v6h3l8 4V5L6 9z" fill="#ffc93c" /><path d="M17 8a5 5 0 010 8" fill="none" stroke="#ffc93c" strokeWidth="2" strokeLinecap="round" /></svg>
const Wifi = () => <svg viewBox="0 0 24 24" fill="none" stroke="#3dff8a" strokeWidth="2.400" strokeLinecap="round"><path d="M2 9a14 14 0 0120 0M5 12.500a9.500 9.500 0 0114 0M8.500 16a5 5 0 017 0" /><circle cx="12" cy="19.500" r="1.200" fill="#3dff8a" /></svg>
const Chev = () => <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, marginLeft: 'auto' }}><path d="M9 5l7 7-7 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Chev2 = () => <svg viewBox="0 0 24 24" style={{ width: 26, height: 26 }}><path d="M5 5l7 7-7 7M12 5l7 7-7 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Crown = () => <svg className="lb-crown" viewBox="0 0 50 36"><defs><linearGradient id="lbcr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff0a0" /><stop offset="1" stopColor="#f0a000" /></linearGradient></defs><path d="M3 30L1 8l12 10L25 2l12 16L49 8l-2 22z" fill="url(#lbcr)" stroke="#c98200" strokeWidth="1.500" strokeLinejoin="round" /><circle cx="25" cy="3" r="3" fill="#ffe27a" /><circle cx="1.500" cy="8" r="2.500" fill="#ffe27a" /><circle cx="48.500" cy="8" r="2.500" fill="#ffe27a" /></svg>
const VS = () => (
  <svg className="lb-a lb-vs" viewBox="0 0 82 110" aria-hidden="true">
    <defs><linearGradient id="lbvs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff2a0" /><stop offset=".5" stopColor="#ffb62e" /><stop offset="1" stopColor="#ff7a00" /></linearGradient></defs>
    <path d="M46 0L18 52h18L26 110 70 40H50z" fill="#ff9d1a" opacity=".35" transform="translate(-10 0) scale(1.1)" />
    <text x="41" y="72" textAnchor="middle" fontFamily="Baloo 2,system-ui,sans-serif" fontStyle="italic" fontWeight="800" fontSize="60" fill="url(#lbvs)" stroke="#9a3f00" strokeWidth="2" paintOrder="stroke">VS</text>
  </svg>
)
const Xp = () => (
  <svg className="lb-a" style={{ left: 214, top: 452, width: 110, filter: 'drop-shadow(0 0 14px rgba(60,200,255,.95))' }} viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id="lbxa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bff4ff" /><stop offset="1" stopColor="#2aa0ff" /></linearGradient></defs>
    <g transform="translate(4 8)" fill="#1b4fb0"><rect x="6" y="38" width="76" height="20" rx="6" transform="rotate(45 44 48)" /><rect x="6" y="38" width="76" height="20" rx="6" transform="rotate(-45 44 48)" /></g>
    <g fill="url(#lbxa)"><rect x="6" y="38" width="76" height="20" rx="6" transform="rotate(45 44 48)" /><rect x="6" y="38" width="76" height="20" rx="6" transform="rotate(-45 44 48)" /></g>
  </svg>
)
const Op = () => (
  <svg className="lb-a" style={{ left: 822, top: 462, width: 110, filter: 'drop-shadow(0 0 14px rgba(255,70,70,.95))' }} viewBox="0 0 120 90" aria-hidden="true">
    <defs><linearGradient id="lbrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff9a9a" /><stop offset="1" stopColor="#e0202a" /></linearGradient></defs>
    <ellipse cx="60" cy="50" rx="46" ry="28" fill="none" stroke="#8a0f1c" strokeWidth="22" />
    <ellipse cx="60" cy="46" rx="46" ry="28" fill="none" stroke="url(#lbrg)" strokeWidth="20" />
    <ellipse cx="60" cy="43" rx="46" ry="28" fill="none" stroke="#fff" strokeWidth="2" opacity=".5" />
  </svg>
)

function Av({ avatar, cls }) {
  return <span className={cls}>{photoOf(avatar) ? <img src={photoOf(avatar)} alt="" draggable="false" /> : <span>{avatar}</span>}</span>
}
function useFit(w, h) {
  const calc = () => Math.min(window.innerWidth / w, window.innerHeight / h)
  const [s, setS] = useState(calc)
  useEffect(() => { const f = () => setS(calc()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return s
}
const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') }
const PETALS = Array.from({ length: 14 }, (_, i) => ({ left: (i * 91 + 30) % 1300, delay: -((i * 1.9) % 14), dur: 11 + (i % 5) * 2.4, s: 0.7 + (i % 4) * 0.25 }))

// Cập nhật danh sách người chơi trong phòng theo sự kiện realtime.
export default function Lobby() {
  const nav = useNavigate()
  const { user, logout } = useApp()
  const [toast, setToast] = useToast()
  const scale = useFit(1280, 720)
  const [ready, setReady] = useState(true)
  const [ping, setPing] = useState(23)
  const [text, setText] = useState('')
  const [msgs, setMsgs] = useState([
    { from: 'PlayerVN', av: '🧑', text: 'Chào mọi người! 👋', t: '14:25' },
    { from: user?.name || 'Bạn', av: user?.avatar || '👧', text: 'Chào bạn! 😍', t: '14:26' },
    { from: 'KingCaro', av: '🧑‍🎤', text: 'Sẵn sàng chưa?', t: '14:27' },
  ])
  const listRef = useRef(null)
  useEffect(() => { const id = setInterval(() => setPing(18 + Math.floor(Math.random() * 16)), 3000); return () => clearInterval(id) }, [])
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [msgs])
  if (!user) return null

  const soon = (n) => () => setToast(`${n}: sắp ra mắt`)
  const pct = Math.max(0, Math.min(100, Math.round((user.exp / user.expMax) * 100)))
  const fmt = (n) => Number(n).toLocaleString('en-US')
  const send = (e) => {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    setMsgs((m) => [...m, { from: user.name, av: user.avatar, text: v, t: hhmm() }])
    setText('')
  }
  const menu = [
    [<Plus />, 'Tạo phòng', () => nav('/create-room')],
    [<Join />, 'Tham gia phòng', () => nav('/join-room')],
    [<Medal />, 'Bảng xếp hạng', () => nav('/leaderboard')],
    [<User />, 'Hồ sơ', () => nav('/profile')],
    [<svg viewBox="0 0 24 24" style={{ color: '#e8eeff' }}><Gear /></svg>, 'Cài đặt', () => nav('/settings')],
    [<Exit />, 'Thoát', () => { logout(); nav('/login') }],
  ]

  return (
    <div className="lb-root">
      <style>{CSS}</style>
      <div className="lb-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        {/* nền */}
        <div className="lb-bgimg" /><div className="lb-moon" /><div className="lb-floor" /><div className="lb-vig" />
        {PETALS.map((p, i) => <span key={i} className="lb-petal" style={{ left: p.left, top: 0, animationDuration: p.dur + 's', animationDelay: p.delay + 's', transform: `scale(${p.s})` }} />)}
        <img className="lb-char" src="/img/boy.png" alt="" draggable="false" style={{ left: -34, top: 160, width: 470 }} />
        <img className="lb-char" src="/img/girl.png" alt="" draggable="false" style={{ left: 668, top: 146, width: 380 }} />
        <Xp /><Op />

        {/* thanh trên */}
        <button className="lb-a lb-me" onClick={() => nav('/profile')} aria-label="Hồ sơ">
          <Av cls="lb-av" avatar={user.avatar} />
          <span className="lb-me-i">
            <div className="lb-nm">{user.name}<i>♛</i></div>
            <div className="lb-lv"><b>Lv.{user.level}</b><div className="lb-xp"><i style={{ width: pct + '%' }} /><span>{fmt(user.exp)} / {fmt(user.expMax)}</span></div></div>
          </span>
        </button>
        <div className="lb-a lb-chip" style={{ left: 355, width: 168 }}><Coin /><span className="n">{fmt(user.coins)}</span><button className="lb-plus" onClick={soon('Nạp xu')} aria-label="Nạp xu">+</button></div>
        <div className="lb-a lb-chip" style={{ left: 540, width: 152 }}><Gem /><span className="n">{fmt(user.gems)}</span><button className="lb-plus" onClick={soon('Nạp kim cương')} aria-label="Nạp kim cương">+</button></div>
        <img className="lb-a lb-logo" src="/img/logo.png" alt="X-O Arena" draggable="false" />
        <button className="lb-ibtn" style={{ left: 1216 }} onClick={() => nav('/settings')} aria-label="Cài đặt"><Gear /></button>

        {/* menu trái */}
        <div className="lb-a lb-act"><Home />Sảnh chờ</div>
        <nav className="lb-a lb-side">
          {menu.map(([ic, label, go]) => <button key={label} className="lb-it" onClick={go}>{ic}{label}</button>)}
        </nav>

        {/* thông tin phòng */}
        <div className="lb-a lb-roomw">
          <div className="lb-hex" /><div className="lb-hex-in" />
          <div className="lb-room-t"><Users />Phòng chờ #1906<span className="lb-badge">2 / 2</span></div>
          <div className="lb-room-s"><span><Pad />Chế độ: Caro 2 người</span><u /><span><Lock />Phòng công khai</span><u /><span><Bolt />Tốc độ: Nhanh</span></div>
        </div>

        {/* người chơi */}
        <div className="lb-a lb-pc me">
          <Crown />
          <Av cls="lb-pav" avatar={user.avatar} />
          <div className="lb-pn">{user.name}<i>♛</i></div>
          <div className="lb-pl">Lv.{user.level}</div>
          <div className="lb-ready">
            <button className={'lb-rb' + (ready ? '' : ' off')} onClick={() => setReady((r) => !r)}><i />{ready ? 'Sẵn sàng' : 'Chưa sẵn sàng'}</button>
            <button className="lb-ck" onClick={() => setReady((r) => !r)} aria-label="Đổi trạng thái"><svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}><path d="M5 12.500l4.500 4.500L19 7.500" fill="none" stroke="#fff" strokeWidth="3.200" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </div>
        </div>
        <VS />
        <div className="lb-a lb-pc op">
          <div className="lb-pav ghost"><span style={{ position: 'relative' }}>
            <svg viewBox="0 0 64 64" style={{ width: 84, height: 84 }}><circle cx="32" cy="22" r="13" fill="#6a65b8" /><path d="M6 62c0-16 11-24 26-24s26 8 26 24z" fill="#6a65b8" /></svg>
            <b style={{ position: 'absolute', left: 0, right: 0, bottom: 8, textAlign: 'center', font: `800 20px ${F}`, color: '#e6e8ff' }}>?</b>
          </span></div>
          <div className="lb-wait" style={{ marginTop: 22 }}>Đang chờ người chơi...</div>
          <button className="lb-inv" onClick={() => nav('/create-room')}><PlusUser />Mời bạn bè</button>
        </div>

        {/* nút dưới */}
        <button className="lb-btn lb-sec" style={{ left: 271, width: 174 }} onClick={() => nav('/mode')}><Door />Rời phòng</button>
        <button className="lb-btn lb-go" onClick={() => nav('/waiting/QUICK')}><Swords />Bắt đầu trận đấu<Chev2 /></button>
        <button className="lb-btn lb-sec" style={{ left: 794, width: 168 }} onClick={() => nav('/create-room')}><PlusUser />Mời bạn bè</button>

        {/* chat */}
        <section className="lb-a lb-chat">
          <div className="lb-ch"><Chat />Chat phòng</div>
          <div className="lb-ml" ref={listRef}>
            {msgs.map((m, i) => (
              <div className="lb-m" key={i}>
                <Av cls="a" avatar={m.av} />
                <div className="c"><small>{m.from}</small><p>{m.text}</p></div>
                <time>{m.t}</time>
              </div>
            ))}
          </div>
          <form className="lb-in" onSubmit={send}>
            <button type="button" className="lb-em" onClick={() => setText((v) => v + '😊')} aria-label="Biểu tượng cảm xúc">😊</button>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập tin nhắn..." maxLength={120} />
            <button className="lb-send" type="submit" aria-label="Gửi"><Plane /></button>
          </form>
        </section>

        {/* thanh dưới */}
        <div className="lb-a lb-bar" style={{ left: 17, width: 455 }}><Mega /><span><b>Thông báo:</b> Chào mừng đến với X-O Arena!</span><Chev /></div>
        <div className="lb-a lb-bar" style={{ left: 972, width: 292 }}>
          <Wifi /><span>Trạng thái mạng:</span>
          <span className="lb-bars"><i style={{ height: 6 }} /><i style={{ height: 10 }} /><i style={{ height: 14 }} /></span>
          <span style={{ marginLeft: 'auto' }}>Ping: {ping}ms</span>
        </div>
      </div>
      {toast}
    </div>
  )
}