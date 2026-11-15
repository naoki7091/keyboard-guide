(()=>{'use strict';
 const d=window.KEYBOARD_DESIGN,e=window.KEYBOARD_EXPLORER_DATA,$=id=>document.getElementById(id);
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 if(!d||!e){$('usage-status').textContent='設計データを読み込めませんでした。関連するJSファイルも同じフォルダーに置いてください。';return;}
 let readout='キーを選んで入力経路を確認',message='キーをクリック／タップしてください。';
 const names={ESC:'Esc',Right:'→',Left:'←',Down:'↓',Back:'Back',DEL:'Del','Caps Lock':'Caps',space:'Space',ime:'IME',fn:'Fn'};
 function keyboard(side,x,y){
  let s=`<g transform="translate(${x} ${y}) scale(2.1)"><rect width="145.35" height="107.25" rx="2.5" fill="#bfcdbc" stroke="#d7e4cd" stroke-width=".5"/>`;
  for(const k of d.sides[side].keys){const w=19.05*k.u-1.3,h=17.75,cx=k.at[0]-34,cy=k.at[1]-34;
   s+=`<g class="usage-key" data-hand="${side}" data-key="${k.ref}" tabindex="0" role="button" aria-label="${side==='L'?'左':'右'} ${esc(k.label)}"><title>${esc(k.label)}</title><rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" rx="1.3" fill="#f4f2e9" stroke="#8da38e" stroke-width=".25"/><text x="${cx-w/2+1.7}" y="${cy-h/2+4.9}" fill="#294a3a" font-size="3.5" font-family="sans-serif">${esc(names[k.label]||k.label)}</text></g>`;
  }return s+'</g>';
 }
 function usage(){const on=$('dongle').checked,l=$('left-usb').checked,r=$('right-usb').checked;
  $('usage-view').innerHTML=`<svg viewBox="0 0 1040 565" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PCのUSB端子に受信ドングル、左右キーボードはBLEで接続。USB-C給電を切替可能"><rect x="310" y="20" width="420" height="190" rx="12" fill="#0d2a23" stroke="#7a9b85" stroke-width="3"/><rect x="324" y="34" width="392" height="156" rx="4" fill="#e7eeda"/><text x="346" y="66" fill="#47745a" font-size="13">USB HID / PC</text><text x="346" y="116" fill="#153e32" font-size="18">${esc(readout)}</text><path d="M500 210V236H450M540 210V236H590" fill="none" stroke="#a0b09a" stroke-width="8"/><rect x="399" y="241" width="245" height="25" rx="4" fill="#0d2a23"/><text x="337" y="259" fill="#d4e6cd" font-size="12">PCのUSB端子</text><rect x="508" y="241" width="20" height="25" rx="2" fill="#a6b79e"/>${on?'<rect x="512" y="253" width="12" height="14" fill="#d7ca92"/><rect x="500" y="267" width="36" height="31" rx="3" fill="#72a387" stroke="#cbd6b5"/><rect x="511" y="274" width="14" height="13" fill="#263f33"/><text x="549" y="290" fill="#dbe8cb" font-size="13">受信ドングル</text><path class="data-line" d="M258 335Q370 272 510 280M783 335Q655 272 526 280"/>':'<text x="530" y="292" fill="#e5bf92" font-size="13">ドングル未接続</text>'}${l?'<path class="power-line" d="M424 254C280 250 18 230 28 477H50"/><text x="65" y="286" fill="#e4bd75" font-size="12">USB-C 給電</text>':''}${r?'<path class="power-line" d="M620 254C775 250 1020 230 1007 477H985"/><text x="868" y="286" fill="#e4bd75" font-size="12">USB-C 給電</text>':''}<text x="50" y="303" fill="#d4e6cd" font-size="13">LEFT / 29 KEYS</text><text x="680" y="303" fill="#d4e6cd" font-size="13">RIGHT / 34 KEYS</text>${keyboard('L',50,315)}${keyboard('R',680,315)}<text x="452" y="395" fill="#99d2d5" font-size="13">BLEで入力を集約</text><text x="425" y="422" fill="#afc5b4" font-size="11">USB給電中もデータはこの経路</text></svg>`;
  $('left-power').textContent='左：'+(l?'USB-Cから給電／電池側を分離':'CR2450から給電（電池SW ONを想定）');$('right-power').textContent='右：'+(r?'USB-Cから給電／電池側を分離':'CR2450から給電（電池SW ONを想定）');$('usage-status').textContent=message;
 }
 function press(target){const k=d.sides[target.dataset.hand]?.keys.find(k=>k.ref===target.dataset.key);if(!k)return;
  if(!$('dongle').checked){readout='USBドングルを接続してください';message='左右の子機はPCへ直接接続しない構成です。';}
  else{readout=(names[k.label]||k.label)+' — '+(target.dataset.hand==='L'?'左':'右')+'から';message=`${k.ref} ${k.label} → マイコン → BLE → 受信ドングル → USB HID → PC（経路の図解）`;}
  usage();
 }
 $('usage-view').addEventListener('click',ev=>{const t=ev.target.closest('[data-key]');if(t)press(t);});
 $('usage-view').addEventListener('keydown',ev=>{const t=ev.target.closest('[data-key]');if(t&&['Enter',' '].includes(ev.key)){ev.preventDefault();press(t);}});
 for(const id of ['dongle','left-usb','right-usb'])$(id).addEventListener('change',()=>{readout='キーを選んで入力経路を確認';message='電源・接続の表示を切り替えました。';usage();});usage();
 function board(){const side=$('board-hand').value,role=$('board-role').value,b=d.sides[side].boards[role],mechanics=e.mechanics[side][role],pt=a=>[a[0]-34,a[1]-34];let s='<rect width="145.35" height="107.25" fill="#285c48" stroke="#8ba581" stroke-width=".25"/>';
  if($('show-tracks').checked)for(const t of b.tracks){const a=pt(t.a),z=pt(t.b);s+=`<path d="M${a.join(' ')}L${z.join(' ')}" stroke="${t.side==='F'?'#ce9b7c':'#91c3cc'}" stroke-width="${t.width}" fill="none" stroke-linecap="round"/>`;}
  for(const loop of mechanics.cutouts)s+=`<path d="M${loop.map(a=>pt(a).join(' ')).join('L')}Z" fill="#edf1e8" stroke="#cfdec1" stroke-width=".15"/>`;
  for(const f of b.parts){for(const p of f.pads){const[x,y]=pt(p.at);if(p.npth){s+=`<ellipse cx="${x}" cy="${y}" rx="${p.drill[0]/2}" ry="${p.drill[1]/2}" fill="#edf1e8"/>`;continue;}s+=`<rect x="${x-p.size[0]/2}" y="${y-p.size[1]/2}" width="${p.size[0]}" height="${p.size[1]}" fill="#d6bd7b" transform="rotate(${-p.angle} ${x} ${y})"><title>${esc(f.ref+'.'+p.pin+' '+p.net)}</title></rect>`;}
   if(/^(U|J|BT|L1|SW40)/.test(f.ref)){const[x,y]=pt(f.at);s+=`<circle cx="${x}" cy="${y}" r="1.2" fill="#e4ebc4"/><text x="${x+1.8}" y="${y-1.8}" font-family="sans-serif" font-size="2.4" fill="#f5f1c6">${f.ref} / ${f.side}</text>`;}}
  $('pcb-view').innerHTML=`<svg viewBox="-2 -2 149.35 111.25" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${side} ${role}の実CAD配線とパッド">${s}</svg>`;
 }
 for(const id of ['board-hand','board-role','show-tracks'])$(id).addEventListener('change',board);board();
 const main=d.sides.L.boards.main.parts,net=(ref,n)=>{const name=main.find(p=>p.ref===ref).pads.find(p=>p.pin===String(n)).net;return name.startsWith('unconnected-')?'NC':name;};
 $('pin-table').innerHTML=Array.from({length:12},(_,i)=>`<tr><td>${i+1}</td><td>${12-i}</td><td>${esc(net('J50',i+1))}</td><td>${esc(net('J51',i+1))}</td></tr>`).join('');
 $('parts-list').innerHTML='<table><thead><tr><th>部品</th><th>型番・数量（左右合計）</th><th>実装・条件</th></tr></thead><tbody>'+e.parts.map(p=>`<tr><th>${esc(p.name)}</th><td>${esc(p.model)}<small>${p.total} ${p.id==='spacers'?'組':'個'}</small></td><td>${esc(p.assembly)}<small>${esc(p.description)}</small>${p.links.map(([name,url])=>` <a href="${esc(url)}">${esc(name)}</a>`).join('')}</td></tr>`).join('')+'</tbody></table>';
 const v=window.COMPACT_VERIFICATION||{},cards=v.cards||[{label:'検証記録',value:'更新中',detail:'最終検査の結果を反映する前の状態です。'}];
 $('verification-results').innerHTML=cards.map(c=>`<article><small>${esc(c.label)}</small><strong>${esc(c.value)}</strong><p>${esc(c.detail)}</p></article>`).join('');
})();
