/* Offline UI. Coordinates and copper paths come from design-data.js. */
(() => {
  'use strict';
  const D = window.KEYBOARD_DESIGN;
  if (!D) { document.getElementById('hero-keyboard').textContent = '設計データを読み込めませんでした。design-data.jsを同じフォルダーに置いてください。'; return; }
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n = value => Math.round(value * 1000) / 1000;
  const p = point => [n(point[0]-34), n(point[1]-34)];
  const W = 145.35, H = 107.25;
  const state = { side:'L', layer:'bottom', explode:.78, board:'bottom', face:'all', copper:'all', focus:'power', traces:true, component:'BT1', connector:'J50', pin:1, step:0 };
  const POWER_NETS=new Set(['CELL_PLUS','CELL_ON','CELL_LIMIT','BOOST_IN','BOOST_EN','BOOST_SW','BOOST_OUT','XIAO_BAT']);
  const pins = {
    J50:['Col0','Col1','GND','GND','Col2','Col3','Col4','Col5','Col6','NC','NC','NC'],
    J51:['Row4','Row3','Row2','Row1','Row0','NC','NC','NC','NC','Reset','GND','NC']
  };
  const layers = {
    keys:{number:'＋',title:'キーキャップとスイッチ',face:'トップから差し込む',body:'完成時に触れる部分です。キーキャップの下にMX系スイッチが入り、スイッチの端子がメインのホットスワップソケットに接続します。',note:'2Uのキーはスタビライザーの方式と対応する開口を別途確認します。色・キー形状は説明用です。'},
    top:{number:'01',title:'トッププレート',face:'スイッチを上から保持',body:'スイッチの位置と向きを揃える層です。メインとボトムに重なる外形、6か所の固定穴を基準にします。',note:'図の開口は現在のキー位置から描いた想定形状。無線版のtopに既存開口を移植済み。2Uスタビライザーの型番・プレート厚と実物の嵌合は発注前に確認します。'},
    main:{number:'02',title:'メイン基板',face:'ソケット・J50/J51はB面／下向き',body:'左29キー・右34キーのホットスワップソケットとダイオード、リセットスイッチを搭載。マトリクスの行・列信号をJ50/J51でボトムへ渡します。',note:'電池・マイコンは載せず、元の145.35×107.25mmを維持。メインの配線幅は0.5mmです。'},
    bottom:{number:'03',title:'電源機能付きボトム基板',face:'マイコンはF面／電池はB面・机側',body:'XIAOと電源回路は内側のF面、CR2450ホルダーは外側のB面に実装。ふた付き一体型ケースのふたを机側から回して外し、電池を交換します。上下基板は分解しません。',note:'ケースは公称8.6mm高。足は公称12mm程度、荷重時11mm以上を想定。USBは左右の外側、電源SWは上辺へ向けています。'}
  };
  const descriptions = {
    BT1:['CR2450 電池ホルダー','MYOUNG BS-24-B4AA014（C7525448）をボトムB面・机側へ実装。CR2450用のふた付き一体型ケースです。ふたをOPEN方向へ回して交換します。公称高さ8.6mm。別体カバーやカバーねじは不要です。'],
    U1:['XIAO nRF52840 Plus','キー走査と無線を担当するマイコン。下面の追加GPIO接点を使います。USB端子は左右それぞれ外側へ向きます。ファームウェアと無線の実動作は未確認です。'],
    U2:['昇圧 / TPS610995','電池側の電圧を固定3.6Vへ昇圧するIC。入力・出力コンデンサとL1を近くに配置しています。起動と負荷変動は実測が必要です。'],
    U3:['分離 / LM66100','昇圧側とXIAO BATの間に置く電源分離IC。USB接続時はVBUSで無効化する設計です。'],
    SW40:['電源スイッチ','ボトム上辺に向くスライドスイッチ。電池のCELL_PLUSからCELL_ONへの経路を切り替えます。ケースには操作できる開口が必要です。'],
    D40:['逆流抑制 / BAS116','一次電池へ戻る電流を抑える低漏れ電流ダイオード。順方向の電圧降下を含めた電源評価は残っています。'],
    R40:['電流制限 / 22Ω','0.75W定格の抵抗。短絡時の電流を制限するために置いています。通常動作でも電圧降下があるため、消耗した電池での起動確認が必要です。'],
    L1:['昇圧用コイル / 2.2µH','Coilcraft XAL4020-222MEC。TPS610995のスイッチ端子と電池入力側を接続する部品です。'],
    R43:['昇圧EN / 1MΩ','BOOST_INから昇圧ICのENへ接続します。電源スイッチON中はUSB接続中も昇圧を維持する設計です。'],
    R46:['電池電圧の分圧 / 3.3MΩ','R47と組み合わせ、昇圧前の電池電圧をXIAO D0 / P0.02で読み取るための抵抗です。'],
    R47:['電池電圧の分圧 / 1MΩ','R46との分圧比は1 / 4.3。実際の残量換算には電池の特性に合わせたファームウェア設定が必要です。'],
    C40:['入力コンデンサ / 47µF','C41とともにBOOST_INを支える入力側コンデンサです。'],
    C41:['入力コンデンサ / 47µF','C40と並列の入力容量。電池の内部抵抗と負荷パルスを含めて評価する段階です。'],
    C42:['入力コンデンサ / 10µF','昇圧ICのVINの近くで電源を安定させるためのコンデンサです。'],
    C43:['出力コンデンサ / 22µF','昇圧出力BOOST_OUTのコンデンサです。実効容量と起動波形の評価は残っています。'],
    C44:['出力コンデンサ / 22µF','昇圧出力BOOST_OUTのコンデンサです。'],
    C47:['出力コンデンサ / 22µF','右手側で昇圧ICの近くに追加した出力コンデンサです。'],
    C45:['BAT側コンデンサ / 1µF','LM66100を通った後のXIAO BAT側のコンデンサです。'],
    C46:['ADCフィルター / 10nF','電池電圧の分圧点CELL_ADCとGNDの間に接続しています。']
  };
  function svg(content, vb, title, cls='') {
    return `<svg viewBox="${vb}" class="${cls}" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg"><title>${esc(title)}</title>${content}</svg>`;
  }
  function rect(x,y,w,h,fill,stroke='none',radius=0,extra='') {
    return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${radius}" fill="${fill==='transparent'?'none':fill}" stroke="${stroke}" ${fill==='transparent'?'pointer-events="all"':''} ${extra}/>`;
  }
  function text(x,y,label,size=3,fill='#243f35',extra='') {
    return `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}" ${extra}>${esc(label)}</text>`;
  }
  function holes(fill='#f6f5f0',role='main') {
    return D.sides[state.side].boards[role].parts.filter(q=>q.ref.startsWith('H')).map(q=>{ const [x,y]=p(q.at),r=q.pads[0].drill[0]/2; return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#79917c" stroke-width=".2"/>`; }).join('');
  }
  function keyShapes(side,mode='caps') {
    return D.sides[side].keys.map(k=>{
      const [x,y]=p(k.at), width=k.u*19.05-1;
      if (mode==='holes') return rect(x-7,y-7,14,14,'#edf0e8','#a0b39e',.5,'stroke-width=".22"');
      const label={space:'Space',ime:'IME',fn:'Fn',Right:'→',Left:'←',Down:'↓','\\':'\\'}[k.label] || k.label;
      return `<g>${rect(x-width/2,y-9,width,18,'#d4dacf','#b4c1b0',1.5,'stroke-width=".3"')}${rect(x-width/2+.8,y-8.1,width-1.6,15.3,'#fcfcf5','#e3e6dc',1.2,'stroke-width=".2"')}${text(x-width/2+2,y-2,label,label.length>8?2.5:3.1)}</g>`;
    }).join('');
  }
  function componentBody(q,role,{labels=true,interactive=false,selected=false}={}) {
    const [x,y]=p(q.at), ref=q.ref;
    if (ref.startsWith('H')) return '';
    let art='', bw=3,bh=2.2;
    if (ref==='BT1') {
      bw=34.5;bh=29.5;
      art=`<circle cx="${x}" cy="${y}" r="14.75" fill="#eee9d8" stroke="#abb59d" stroke-width=".35"/><circle cx="${x}" cy="${y}" r="13.1" fill="#f6f1df" stroke="#c5c4aa" stroke-width=".25"/>`+rect(x-6,y-1,12,2,'#c7c5aa','none',.6)+text(x,y-5,'CR2450',2.8,'#64715c','text-anchor="middle"')+text(x,y+6,'OPEN ↶',2.4,'#758269','text-anchor="middle"');
      if(labels)art+=text(x,y+18,'ふた一体 / B面',2.2,'#c7d8bc','text-anchor="middle"');
      const positive=q.pads.find(a=>a.pin==='1'); if (positive) { const [px,py]=p(positive.at);art+=text(px,py-3,'+',3.6,'#f7edc7','text-anchor="middle"'); }
    } else if(ref==='U1') {
      bw=21.2;bh=19.2;
      art=rect(x-bw/2,y-bh/2,bw,bh,'#397665','#a7cfb0',.7,'stroke-width=".3"')+rect(x-5,y-5.2,10,10.4,'#c0cec0','#719582',.6)+text(x,y-.5,'XIAO',2.5,'#204d3c','text-anchor="middle"')+text(x,y+3,'Plus',2,'#204d3c','text-anchor="middle"');
      const usbX=state.side==='L'?-1.49:W-4;
      art+=rect(usbX,y-3.6,5.49,7.2,'#d6ded5','#839c8b',.7,'stroke-width=".3"');
    } else if (ref==='J50'||ref==='J51') {
      bw=role==='main'?30.99:30.48;bh=role==='main'?2.41:2.54;
      art=rect(x-bw/2,y-bh/2,bw,bh,role==='main'?'#244d3d':'#bb9948','#e4c77c',.2,'stroke-width=".22"');
      art+=q.pads.map(a=>{const [px,py]=p(a.at); return `<circle cx="${px}" cy="${py}" r=".45" fill="${role==='main'?'#101f19':'#f7e2a5'}"/>`;}).join('');
      if(labels)art+=text(x-bw/2,y+4.1,ref,2.2,'#e2d6ab');
      const [px,py]=p(q.pads.find(a=>a.pin==='1').at); art+=`<path d="M ${px-.9} ${py-2} l .9 -1.3 .9 1.3 Z" fill="#f0d583"/>`;
    } else if (ref.startsWith('SW') && role==='main') {
      const isReset=q.pads.some(a=>a.net==='Reset');bw=isReset?6:10.8;bh=isReset?6:6;
      art=rect(x-bw/2,y-bh/2,bw,bh,isReset?'#c1bea7':'#5d6e61','#9bb19c',.5,'stroke-width=".22"');
      if(!isReset) art+=`<circle cx="${x}" cy="${y}" r="1.4" fill="#20382b"/>`;
      if(labels&&isReset)art+=text(x+4,y+1,'Reset',1.8,'#d4ddca');
    } else if (ref==='SW40') {
      bw=9;bh=4;art=rect(x-4.5,y-2,9,4,'#2b4034','#c6c7ac',.3)+rect(x-1.3,y-3.8,2.6,2,'#cdd1b9','#718373',.2);
      if(labels)art+=text(x,y+6,'電源SW',2.1,'#d6e1cc','text-anchor="middle"');
    } else if (ref==='L1') {
      bw=4;bh=4;art=rect(x-2,y-2,4,4,'#c0b08b','#e1cba0',.5);if(labels)art+=text(x+2.7,y+1,ref,1.7,'#d3d9bd');
    } else if (ref==='U2'||ref==='U3') {
      bw=ref==='U2'?2:2.5;bh=ref==='U2'?2:2;art=rect(x-bw/2,y-bh/2,bw,bh,'#1a2b23','#b2c6a6',.15,'stroke-width=".2"');if(labels)art+=text(x+2,y+1,ref,1.7,'#d3d9bd');
    } else if(ref.startsWith('TP')) {
      art=`<circle cx="${x}" cy="${y}" r=".6" fill="#cfb45d" stroke="#f0dda0" stroke-width=".2"/>`;bw=2;bh=2;
    } else {
      bw=ref.startsWith('D')?3.4:2.5;bh=ref.startsWith('D')?1.7:1.3;
      if (ref==='R40') {bw=5;bh=2.5;}
      art=rect(x-bw/2,y-bh/2,bw,bh,ref.startsWith('D')?'#405346':'#b4ab86','#c4c6a2',.1,'stroke-width=".15"');
      if(labels&&role==='bottom')art+=text(x+2,y-.8,ref,1.5,'#c9d6bf');
    }
    const hit = rect(x-bw/2-1,y-bh/2-1,bw+2,bh+2,'transparent','none',.4);
    const outline=rect(x-bw/2-.9,y-bh/2-.9,bw+1.8,bh+1.8,'none',selected?'#ffe18e':'none',.5,'class="component-outline" stroke-width=".6"');
    return `<g ${interactive?`class="pcb-component" role="button" tabindex="0" data-component="${esc(ref)}" aria-label="${esc(ref+' '+q.value)}"`:''}>${art}${outline}${interactive?hit:''}</g>`;
  }
  function boardBody(side,role,opts={}) {
    const data=D.sides[side].boards[role];
    const bg=opts.light?'#d4dfcd':'#2b5a43';
    let out=rect(0,0,W,H,bg,opts.selected?'#c6a84b':'#628268',1.8,`stroke-width="${opts.selected?.9:.35}"`);
    const rf=D.metadata.sides[side].rf_mm, [rx,ry]=p(rf);
    out+=rect(rx,ry,rf[2]-rf[0],rf[3]-rf[1],'#aac47818','#b2ce89',0,'stroke-width=".3" stroke-dasharray="1 .7"');
    if(role==='bottom') {const cut=D.metadata.sides[side].cutout_mm,[cx,cy]=p(cut);out+=rect(cx,cy,cut[2]-cut[0],cut[3]-cut[1],opts.light?'#f6f5f0':'#152f27','#9bb48b',.25,'stroke-width=".25"');}
    if(opts.traces&&['power','gnd'].includes(opts.focus)) {
      out+='<g pointer-events="none" fill-rule="evenodd" data-copper-zones="true">';
      for(const zone of data.zones||[]) {
        if(zone.net!=='GND'||(opts.copper!=='all'&&zone.side!==opts.copper))continue;
        out+=zone.paths.map(path=>`<path d="${path}" fill="#86cc9c" opacity="${zone.side==='F'?.18:.10}" data-zone-net="GND" data-side="${zone.side}"/>`).join('');
      }
      out+='</g>';
    }
    if(opts.traces) {
      out+=`<g fill="none" stroke-linecap="round" stroke-linejoin="round">`;
      for(const t of data.tracks) {
        if(opts.copper&&opts.copper!=='all'&&t.side!==opts.copper)continue;
        const [a,b]=[p(t.a),p(t.b)], active=(!opts.net||t.net===opts.net)&&(!opts.focus||opts.focus==='all'||(opts.focus==='power'?POWER_NETS.has(t.net):t.net==='GND'));
        out+=`<path d="M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}" stroke="${opts.net&&active?'#ffe393':t.side==='F'?'#cf865e':'#83a8c5'}" stroke-width="${t.width}" opacity="${active?.85:.11}"/>`;
      }
      out+='</g>';
      out+=data.vias.map(v=>{const [x,y]=p(v.at), active=!opts.net||opts.net===v.net;return `<circle cx="${x}" cy="${y}" r="${v.size/2}" fill="#aec0a3" opacity="${active?.8:.18}"/><circle cx="${x}" cy="${y}" r="${v.drill/2}" fill="#244b37"/>`;}).join('');
    }
    out+=data.parts.filter(q=>!opts.face||opts.face==='all'||q.side===opts.face||q.ref.startsWith('H')).map(q=>componentBody(q,role,{labels:opts.labels!==false,interactive:opts.interactive,selected:q.ref===opts.component})).join('');
    if(opts.traces) {
      out+=data.parts.flatMap(q=>q.pads.filter(a=>a.pin&&!a.npth&&(!opts.copper||opts.copper==='all'||a.layers.includes(opts.copper))).map(a=>{
        const [x,y]=p(a.at);const active=!opts.net||a.net===opts.net;
        const opacity=active?.82:.16;
        let s=a.circle?`<circle cx="${x}" cy="${y}" r="${a.size[0]/2}" fill="#d9c584" opacity="${opacity}"/>`:rect(x-a.size[0]/2,y-a.size[1]/2,a.size[0],a.size[1],opts.net&&active?'#ffe295':'#c7c3a2','none',.12,`opacity="${opacity}" transform="rotate(${-a.angle} ${x} ${y})"`);
        if(a.drill[0])s+=`<circle cx="${x}" cy="${y}" r="${a.drill[0]/2}" fill="#1a3b2a"/>`;
        return s;
      })).join('');
    }
    if(role==='main'&&opts.interactive)out+=D.sides[side].keys.map(k=>{const [x,y]=p(k.at);return `<g class="pcb-component" role="button" tabindex="0" data-component="${k.ref}" aria-label="${esc(k.label+' '+k.ref)}">${rect(x-7,y-7,14,14,'transparent',state.component===k.ref?'#ffe18e':'#a7b69788',.4,'stroke-width=".25"')}${text(x-6,y-4,k.label,2.1,'#e4e6c8')}</g>`;}).join('');
    // Power is redrawn ABOVE the illustrative component bodies: these are the
    // actual copper centre lines, not a straight schematic shortcut to the MCU.
    if(role==='bottom'&&opts.traces&&['power','gnd'].includes(opts.focus)) {
      out+='<g pointer-events="none" fill="none" stroke-linecap="round" stroke-linejoin="round" data-power-overlay="true">';
      for(const t of data.tracks) {
        if(opts.copper!=='all'&&opts.copper!==t.side)continue;
        if(!(t.net==='GND'||opts.focus==='power'&&POWER_NETS.has(t.net)))continue;
        const [a,b]=[p(t.a),p(t.b)],color=t.net==='GND'?'#9be5ae':'#ffe393';
        out+=`<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${color}" stroke-width="${Math.max(t.width,.4)}" data-net="${esc(t.net)}" data-side="${t.side}"/>`;
      }
      for(const v of data.vias.filter(v=>v.net==='GND'||opts.focus==='power'&&POWER_NETS.has(v.net))) {
        const [x,y]=p(v.at);out+=`<circle cx="${x}" cy="${y}" r="${v.size/2}" stroke="${v.net==='GND'?'#9be5ae':'#ffe393'}" stroke-width=".15"/>`;
      }
      out+='</g>';
      const endpoints=[['BT1','2','− / GND'],['U1','13','U1.13 GND'],['U1','27','GND'],['U1','29','GND']];
      if(opts.focus==='power')endpoints.push(['BT1','1','＋'],['U1','28','U1.28 BAT']);
      out+='<g pointer-events="none">';
      for(const [ref,pin,label] of endpoints) {
        const q=data.parts.find(q=>q.ref===ref),a=q.pads.find(a=>a.pin===pin);
        if(opts.copper!=='all'&&!a.layers.includes(opts.copper))continue;
        const [x,y]=p(a.at),ground=a.net==='GND',color=ground?'#9be5ae':'#ffe393';
        out+=`<circle cx="${x}" cy="${y}" r="1.1" fill="none" stroke="${color}" stroke-width=".35" data-power-terminal="${ref}.${pin}"/>`;
        if(ref==='BT1')out+=text(x,y-3,label,2.5,color,'text-anchor="middle"');
        if(ref==='U1'&&(pin==='28'||pin==='13')) {
          const anchor=side==='L'?'start':'end',tx=side==='L'?27:W-27,ty=pin==='28'?94:100;
          out+=`<path d="M${x} ${y}L${tx+(side==='L'?-1:1)} ${ty-1}" stroke="${color}" stroke-width=".25" fill="none"/>`+rect(side==='L'?tx-.5:tx-15.5,ty-2.7,16,3.7,'#244633','none',.4)+text(tx,ty,label,2.2,color,`text-anchor="${anchor}"`);
        }
      }
      out+='</g>';
    }
    if(role==='bottom'&&opts.face==='B') {
      const service=D.metadata.battery_service;
      if(service) {
        const [cx,cy]=p(service.holder_centre_mm),[cw,ch]=service.cover_outer_body_mm;
        out+=`<circle cx="${cx}" cy="${cy}" r="14.75" fill="none" stroke="#e5c58a" stroke-width=".3" pointer-events="none"/>`;
        for(const [i,at] of service.cover_mount_centres_mm.entries()) {
          const [x,y]=p(at);out+=`<circle cx="${x}" cy="${y}" r="2.1" fill="none" stroke="#e5c58a" stroke-width=".3"/>`+text(x,y+5,'H'+(i+7),2.2,'#e5c58a','text-anchor="middle"');
        }
        for(const at of service.feet_centres_mm) {
          const [x,y]=p(at);out+=`<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#bdd7bb" stroke-dasharray=".7 .6" stroke-width=".25"/>`;
        }
      }
    }
    out+=holes(opts.light?'#f6f5f0':'#172f29',role);
    out+=text(W-4,H-3,`${side} / ${role.toUpperCase()} / ${role==='main'?'B ↓':'F ↑'}`,1.9,opts.light?'#6a7e67':'#b9cfb3','text-anchor="end"');
    return out;
  }
  function hero() {
    let art='<defs><linearGradient id="board-edge" x2="0" y2="1"><stop stop-color="#d1d8cb"/><stop offset="1" stop-color="#9fae9c"/></linearGradient></defs>';
    for(const [side,x] of [['L',28],['R',229]]) {
      art+=`<g transform="translate(${x} 53) skewY(-4)">${rect(-2,-2,W+4,H+7,'url(#board-edge)','#91a28e',3)}${rect(0,0,W,H,'#aabda3','#6c886b',2)}${keyShapes(side)}${text(2,-9,side==='L'?'LEFT / 29 KEYS':'RIGHT / 34 KEYS',2.4,'#79907c')}</g>`;
    }
    art+=text(104,192,'左右をつなぐケーブルは使わない構想',3.3,'#6d836f');
    art+='<g fill="none" stroke="#9fb795" stroke-width=".6" stroke-dasharray="2 2"><path d="M100 162 Q120 207 199 220"/><path d="M305 151 Q290 207 219 220"/></g>';
    art+=rect(196,215,27,10,'#a4b69b','#7d9674',1)+rect(207,211,6,5,'#d8d9c8','#839775',.4);
    art+=text(209,236,'USBドングルへ / 通信構成案',2.6,'#6d836f','text-anchor="middle"');
    art+=text(15,170,'← USB',3,'#446c55')+text(345,165,'USB →',3,'#446c55');
    $('hero-keyboard').innerHTML=svg(art,'0 20 410 225','左29キー・右34キーの無線分割キーボード。外装は模式図、左右からUSBドングルへ無線で送る構想。');
  }
  function stackSvg({explode=state.explode,selected=state.layer,compact=false}={}) {
    const bottomY=385,mainY=bottomY-38-135*explode,topY=mainY-12-52*explode,keyY=topY-8-35*explode;
    const positions={bottom:bottomY,main:mainY,top:topY,keys:keyY};
    let out='<defs><filter id="stack-shadow"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#243e2e" flood-opacity=".10"/></filter></defs>';
    // Fixed-hole guide lines use the same physical coordinates on every layer.
    for(const h of [[3,3],[142.35,3],[3,104.25],[142.35,104.25]]) {
      const xx=320+2.75*h[0]-.95*h[1], yy=.5*h[0]+1.4*h[1];
      out+=`<path d="M${xx} ${yy+bottomY} L${xx} ${yy+topY}" stroke="#a3b5a1" stroke-width=".8" stroke-dasharray="3 4" fill="none"/>`;
    }
    const battery=D.sides[state.side].boards.bottom.parts.find(q=>q.ref==='BT1');
    if(battery?.side==='B') {
      const [cx,cy]=p(battery.at);
      out+=`<g transform="matrix(2.75 .5 -.95 1.4 320 ${bottomY+22+40*explode})" opacity=".85">${componentBody(battery,'bottom',{labels:false})}</g>`;
    }
    for(const layer of ['bottom','main','top','keys']) {
      const opacity=selected===layer?1:(selected==='keys'&&layer==='top'?.88:.67);
      let body;
      if(layer==='bottom'||layer==='main')body=boardBody(state.side,layer,{labels:false,selected:layer===selected,traces:layer==='main',light:false,face:layer==='bottom'?'F':'all'});
      else if(layer==='top')body=rect(0,0,W,H,'#a9bba2','#778f73',1.8,'stroke-width=".5"')+keyShapes(state.side,'holes')+holes('#eff0e9','top');
      else body=keyShapes(state.side);
      out+=`<g class="stack-piece" transform="matrix(2.75 .5 -.95 1.4 320 ${positions[layer]})" opacity="${opacity}" filter="url(#stack-shadow)">${body}</g>`;
    }
    const labels=[['keys','キーキャップ',keyY+66],['top','01 トップ',topY+82],['main','02 メイン',mainY+97],['bottom','03 ボトム',bottomY+112]];
    if(explode>.3)for(const [layer,label,y] of labels)out+=`<path d="M725 ${y} h35" stroke="${layer===selected?'#447b56':'#b4c1ae'}" fill="none"/>`+text(770,y+4,label,12,layer===selected?'#21583e':'#80927b');
    out+=text(310,671,`${state.side==='L'?'左手':'右手'} · ふた付き電池ケースはボトムの下（机側）`,12,'#627a62');
    if(explode>.3)out+=text(610,553,'↑ F面 / ボトム',10,'#637d60')+text(610,mainY+230,'B面 / メイン ↓',10,'#637d60');
    return svg(out,compact?'150 20 750 680':'120 0 810 700','トップ、メイン、ボトムの分解図。マイコンは内側、ふた付き電池ケースは机側にあります。');
  }
  function renderStack() {
    $('stack-view').innerHTML=stackSvg();
    const l=layers[state.layer];
    $('layer-detail').innerHTML=`<p class="eyebrow">${l.number} / ${state.layer.toUpperCase()}</p><h3>${l.title}</h3><span class="face-label">${l.face}</span><p>${l.body}</p><p class="small">${l.note}</p>`;
    document.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layer===state.layer)));
  }
  function describe(ref) {
    if(descriptions[ref])return descriptions[ref];
    if(ref==='J50'||ref==='J51')return [ref==='J50'?'列信号の基板間コネクタ':'行信号とResetのコネクタ',`${ref}の12端子。${state.board==='main'?'メインB面のメスソケット':'ボトムF面のオスヘッダー'}です。上下の同じ番号を合わせます。端子1のマークを確認してください。`];
    const key=D.sides[state.side].keys.find(k=>k.ref===ref);
    if(key)return [`${key.label} / ${key.u}U`,`マトリクスのRow${key.row} × Col${key.col}。ダイオードD${ref.slice(2)}を介して行に接続し、${ref}はメインB面のホットスワップソケットです。`];
    if(ref.startsWith('D'))return ['キー用ダイオード',`${ref}は同じ番号のキーに対応。1番端子がカソード（行側）、2番端子がアノード（スイッチ側）。COL2ROWで走査する設計です。`];
    if(ref.startsWith('TP'))return ['測定用テストパッド','電源やResetを測るための銅箔パッドです。接続ネットは下の部品データを参照してください。'];
    return ['リセットスイッチ','メインのResetをGNDへ接続し、基板間コネクタを通じてボトムのマイコンへ伝えます。'];
  }
  function renderInspector() {
    const q=D.sides[state.side].boards[state.board].parts.find(q=>q.ref===state.component);
    if(!q){$('component-detail').innerHTML='<h3>部品を選択</h3><p>図の部品か下の一覧から選ぶと、役割と位置を確認できます。</p>';return;}
    const [title,body]=describe(q.ref);
    const nets=[...new Set(q.pads.map(p=>p.net).filter(v=>v&&!v.startsWith('unconnected-')))];
    $('component-detail').innerHTML=`<h3>${esc(q.ref)}</h3><b>${esc(title)}</b><p>${esc(body)}</p><p class="small">${esc(q.value)}<br>位置 X ${q.at[0]} / Y ${q.at[1]} mm<br>実装面 ${q.side==='F'?'F面 / 上向き':'B面 / 下向き'}${nets.length?'<br>接続 '+nets.map(esc).join(' / '):''}</p>`;
  }
  function renderBoard() {
    $('pcb-view').innerHTML=svg(boardBody(state.side,state.board,{traces:state.traces,copper:state.copper,face:state.face,focus:state.focus,interactive:true,component:state.component}),'-6 -5 157.35 120.25',`${state.side==='L'?'左':'右'}${state.board==='main'?'メイン':'ボトム'}基板の実配置と配線。部品はクリックまたはキーボードで選択できます。`);
    $('component-side').value=state.face;
    const powerView=state.board==='bottom'&&state.focus==='power',gndView=state.focus==='gnd';
    $('trace-focus').value=state.focus;
    $('trace-focus').querySelector('[value="power"]').disabled=state.board!=='bottom';
    $('board-orientation').textContent=(powerView||gndView?'金色は電源、緑はGND。強調線の太さは製造上の幅ではありません。':'全配線表示ではベタ銅箔を省略。')+' 部品面・銅箔面とも上からの透視で、左右は反転していません。BT1はB面・机側です。';
    if(state.board==='bottom') {
      const verified=D.sides[state.side].boards.bottom.powerConnections;
      const verifiedOkay=verified?.length===9&&verified.every(c=>c.connected);
      $('power-connection-note').innerHTML=`<b>電源はXIAOのBAT端子へ接続</b><p>BT1 → SW40 → R40 → D40 → 昇圧 → LM66100 → <strong>U1.28（BAT）</strong>。電池のマイナスは<b>GNDベタ銅箔</b>を通してU1.13 / 27 / 29へつながります。</p><p>${verifiedOkay?'左右別に、実際の銅箔とベタ銅箔による9区間の接続を再確認済み。':'端子接続の検証データを再生成してください。'}${state.copper!=='all'?' 現在は片面だけの表示です。経路全体を見るには「F面＋B面」を選んでください。':''}${!state.traces?' 配線表示はOFFになっています。':''} 昇圧の実動作・実機の通電確認とは別の検査です。</p>`;
    } else $('power-connection-note').innerHTML='';
    $('component-select').innerHTML='<option value="">部品を選択</option>'+D.sides[state.side].boards[state.board].parts.filter(q=>!q.ref.startsWith('H')).sort((a,b)=>a.ref.localeCompare(b.ref,'en',{numeric:true})).map(q=>`<option value="${esc(q.ref)}" ${q.ref===state.component?'selected':''}>${esc(q.ref+' — '+(D.sides[state.side].keys.find(k=>k.ref===q.ref)?.label||q.value))}</option>`).join('');
    document.querySelectorAll('[data-board]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.board===state.board)));
    renderInspector();
  }
  function connectorDrawing() {
    const ref=state.connector, net=pins[ref][state.pin-1];
    const main=D.sides[state.side].boards.main.parts.find(q=>q.ref===ref);
    const bottom=D.sides[state.side].boards.bottom.parts.find(q=>q.ref===ref);
    const byNum=q=>q.pads.find(a=>Number(a.pin)===state.pin);
    let out='';
    for(const [role,x,q] of [['main',30,main],['bottom',570,bottom]]) {
      out+=text(x,24,role==='main'?'メイン B面の部品を上から透視':'ボトム F面を上から見る',14,'#375f46');
      out+=`<g transform="translate(${x} 49) scale(2.9)">${boardBody(state.side,role,{traces:true,labels:false,net:net==='NC'?'__NC__':net})}</g>`;
      const [px,py]=p(byNum(q).at);const cx=x+2.9*px,cy=49+2.9*py;
      out+=`<circle cx="${cx}" cy="${cy}" r="7" fill="none" stroke="#c09736" stroke-width="2.2"/>`;
      out+=text(x,385,`${ref}.${state.pin}  /  ${net}  /  ${role==='main'?'メス・下向き':'オス・上向き'}`,13,'#486b4f');
    }
    out+=`<path d="M475 189 h63 m-10 -7 10 7 -10 7" fill="none" stroke="#81a077" stroke-width="1.5"/>`;
    out+=text(508,217,'同じ番号',11,'#7a9174','text-anchor="middle"');
    out+=text(508,236,'を重ねる',11,'#7a9174','text-anchor="middle"');
    return svg(out,'0 0 1040 405','メインとボトムの同一座標・同一端子番号を対応させる図。両面とも上から透視し、鏡像反転していません。');
  }
  function renderConnector() {
    const isTop=(state.side==='L'&&state.connector==='J50')||(state.side==='R'&&state.connector==='J51');
    $('connector-location').textContent=`${state.side==='L'?'左手':'右手'}：${state.connector}は${isTop?'上':'下'}側の列。図は両基板とも上からの透視です。`;
    $('connector-view').innerHTML=connectorDrawing();
    $('pin-buttons').innerHTML=pins[state.connector].map((name,i)=>`<button type="button" data-pin="${i+1}" aria-label="端子${i+1} ${name}" aria-pressed="${i+1===state.pin}">${i+1}</button>`).join('');
    const net=pins[state.connector][state.pin-1];
    const detail=net.startsWith('Col')?'列信号。メインのキーからボトムのXIAOへ接続します。':net.startsWith('Row')?'行信号。ダイオードのカソード側とXIAOの行入力を接続します。':net==='GND'?'上下の基準電位を合わせるGNDです。ベタ銅箔はこの図では省略しています。':net==='Reset'?'メインのリセットスイッチからXIAO Resetへ接続します。':'NCは未使用端子。電源やほかの信号をつながない端子です。';
    $('pin-detail').innerHTML=`<strong>${esc(net)}</strong><code>${state.connector}.${state.pin} → ${state.connector}.${state.pin}</code><p>${detail}</p>`;
    document.querySelectorAll('[data-connector]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.connector===state.connector)));
  }
  const steps=[
    {title:'部品と向きを揃える',layer:'bottom',explode:.95,body:'左右それぞれのメインとボトムを一組にします。外側に向くUSB、上辺に向く電源スイッチ、6か所の固定穴を確認します。電源をOFFにし、USBと電池を外した状態で組み立てます。',point:'メインのφ4.4mm穴へ外径4mmのスペーサーを通します。15mmはメイン下面〜ボトム上面の間隔で、スペーサー全長ではありません。'},
    {title:'ボトムの両面を準備する',layer:'bottom',explode:.95,body:'XIAO・電源回路・オスヘッダーはF面（内側）、電池ホルダーBT1はB面（机側）に実装します。電池ケースはふた付きの一体型部品で、別体カバー用のねじ穴はありません。',point:'電池はまだ入れません。ボトムは両面実装です。電池ケースC7525448はJLCPCBのSMT実装部品。発注時の在庫とふたの同梱・実装後の扱いを確認します。'},
    {title:'メインB面の接続部を準備',layer:'main',explode:.9,body:'ホットスワップソケット、ダイオード、リセットスイッチと、J50/J51のメスソケットをメインの指定面に実装します。メス側はB面、完成時に下向きになる面です。',point:'コネクタをF面に付けるとボトム側に届きません。メインとボトムの端子1の位置を、上からの同じ座標で照合します。'},
    {title:'トップとスイッチを合わせる',layer:'top',explode:.65,body:'最終化したトッププレートへスイッチを装着し、メインのソケットにスイッチ端子を合わせます。2Uキーは適合するスタビライザーを確認します。キーキャップは最後に取り付けられます。',point:'無線版topの開口位置と6固定穴はメインに一致。2Uスタビライザーの型番・プレート厚と嵌合は発注前に確認します。'},
    {title:'J50・J51の番号を合わせる',layer:'main',explode:.45,body:'メインのJ50をボトムのJ50へ、J51をJ51へ合わせます。各端子は1番同士から12番同士まで対応します。上からの透視図では左右の基板で座標が一致します。',point:'左手は上J50・下J51、右手は上J51・下J50。B面を裏から眺める場合は左右が反転して見えるので、印字と端子1を基準にします。'},
    {title:'スペーサーを通し、上下から固定',layer:'bottom',explode:.08,body:'コネクタ2本を同時に、基板を平行に保って差し込みます。メインのφ4.4mm穴に外径4mmスペーサーを通し、トップとボトムのφ2.2mm穴からM2ねじを入れてスペーサーへ固定します。6穴の中心は全層同じです。',point:'メイン下面〜ボトム上面15mm、コネクタ挿入量約4.18mmが目標です。トップ厚とスイッチ保持高さを決めて、スペーサー全長・ねじ長を選びます。'},
    {title:'一体型ケースのふたと足を確認',layer:'keys',explode:0,body:'CR2450の極性を確認して装着し、一体型ケースのふたを閉じます。ゴム足は高さ12mm程度を仮定し、荷重時に基板下面から机まで11mm以上残るように選びます。交換時は電源OFF・USBを外して裏返し、ふたをOPEN方向に回します。',point:'ケースは公称8.6mm、検査包絡9mm。実物の嵌合と足の圧縮は未確認です。初回通電・無線・昇圧動作・電池寿命は別工程で検証します。'}
  ];
  function renderStep() {
    const step=steps[state.step];
    $('step-list').innerHTML=steps.map((s,i)=>`<li><button type="button" data-step="${i}" ${i===state.step?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${s.title}</button></li>`).join('');
    $('step-counter').textContent=`STEP ${String(state.step+1).padStart(2,'0')} / ${steps.length}`;
    $('step-diagram').innerHTML=stackSvg({explode:step.explode,selected:step.layer,compact:true});
    $('step-copy').innerHTML=`<h3>${step.title}</h3><p>${step.body}</p><div class="step-point">${step.point}</div>`;
    $('prev-step').disabled=state.step===0;$('next-step').disabled=state.step===steps.length-1;
  }
  function setSide(side) {
    state.side=side;
    if(state.component&&!D.sides[side].boards[state.board].parts.some(q=>q.ref===state.component))state.component='';
    document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===side)));
    renderStack();renderBoard();renderConnector();renderStep();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(button?.dataset.side){setSide(button.dataset.side);return;}
    if(button?.dataset.layer){state.layer=button.dataset.layer;renderStack();return;}
    if(button?.dataset.board){state.board=button.dataset.board;state.face='all';state.component=state.board==='bottom'?'BT1':'SW1';state.focus=state.board==='bottom'?'power':'all';renderBoard();return;}
    if(button?.dataset.connector){state.connector=button.dataset.connector;state.pin=1;renderConnector();return;}
    if(button?.dataset.pin){state.pin=Number(button.dataset.pin);renderConnector();$('pin-buttons').querySelector(`[data-pin="${state.pin}"]`).focus({preventScroll:true});return;}
    if(button?.dataset.step){state.step=Number(button.dataset.step);renderStep();$('step-list').querySelector(`[data-step="${state.step}"]`).focus({preventScroll:true});return;}
    const component=event.target.closest('[data-component]');
    if(component){state.component=component.dataset.component;renderBoard();}
  });
  $('pcb-view').addEventListener('keydown',event=>{
    const part=event.target.closest('[data-component]');
    if(part&&(event.key==='Enter'||event.key===' ')){event.preventDefault();state.component=part.dataset.component;renderBoard();$('component-select').focus({preventScroll:true});}
  });
  $('explode').addEventListener('input',e=>{state.explode=Number(e.target.value)/100;$('explode-value').textContent=e.target.value+'%';renderStack();});
  $('copper-side').addEventListener('change',e=>{state.copper=e.target.value;renderBoard();});
  $('trace-focus').addEventListener('change',e=>{state.focus=e.target.value;state.traces=true;$('show-traces').checked=true;renderBoard();});
  $('component-side').addEventListener('change',e=>{state.face=e.target.value;if(state.board==='bottom'&&state.face!=='all')state.component=state.face==='B'?'BT1':'U1';renderBoard();});
  $('view-battery-bottom').addEventListener('click',()=>{state.board='bottom';state.face='B';state.focus='power';state.copper='all';state.traces=true;state.component='BT1';$('copper-side').value='all';$('show-traces').checked=true;renderBoard();$('boards').scrollIntoView({behavior:'smooth'});});
  $('show-traces').addEventListener('change',e=>{state.traces=e.target.checked;renderBoard();});
  $('component-select').addEventListener('change',e=>{state.component=e.target.value;renderBoard();});
  $('clear-selection').addEventListener('click',()=>{state.component='';renderBoard();});
  $('prev-step').addEventListener('click',()=>{if(state.step>0){state.step--;renderStep();}});
  $('next-step').addEventListener('click',()=>{if(state.step<steps.length-1){state.step++;renderStep();}});
  $('print-guide').addEventListener('click',()=>window.print());
  $('pin-table').innerHTML=Array.from({length:12},(_,i)=>`<tr><td>${i+1}</td><td>${pins.J50[i]} → ${pins.J50[i]}</td><td>${pins.J51[i]} → ${pins.J51[i]}</td></tr>`).join('');
  $('print-steps').innerHTML=steps.map((s,i)=>`<article><h3>${i+1}. ${s.title}</h3><p>${s.body}</p><p>${s.point}</p></article>`).join('');
  $('verification-stats').innerHTML=`<div><strong>${D.verification.checks.toLocaleString('ja-JP')}</strong><span>検証項目を通過</span></div><div><strong>4枚 / 0件</strong><span>各基板の未配線・DRC違反</span></div><div><strong>10,668</strong><span>単押し・2キー・3キーの理想走査</span></div>`;
  hero();setSide('L');
  // A tiny read-only diagnostic surface for offline smoke checks.
  window.assemblyGuide={getState:()=>({...state}),sourceHashes:D.sources,stepCount:steps.length};
})();
