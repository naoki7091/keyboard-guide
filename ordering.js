(()=>{'use strict';
  const $=id=>document.getElementById(id);
  const scenarios={
    requested:{common:5,mcu:1,status:'希望構成・受付方法は個別確認',pending:true,note:'ボトムは各5枚すべてに共通部品、うち各1枚にXIAOを実装。残る各4枚はXIAOのみ省略します。同一製造ロット内でこの区別を受け付けるかは未確認です。'},
    minimum:{common:2,mcu:2,status:'通常の数量に合わせた比較案・希望構成とは異なる',pending:false,note:'ボトム各2枚をXIAOを含めて全実装する想定です。残る各3枚は共通部品も含めて未実装の裸基板です。マイコンだけを省略した完成基板が3枚届く構成ではありません。両面実装・部品条件の受け付けは別途確認します。'},
    all:{common:5,mcu:5,status:'全数同じBOMで実装する比較案',pending:false,note:'ボトム各5枚すべてにXIAOと共通部品を実装する想定です。本体マイコンは計10個になります。両面実装・部品条件の受け付けは別途確認します。'}
  };
  function render(){
    const s=scenarios[$('order-scenario').value]||scenarios.requested;
    $('pcb-total').innerHTML='30<span>枚</span>';
    $('assembly-total').innerHTML=`${10+2*s.common}<span>枚</span>`;
    $('mcu-total').innerHTML=`${2*s.mcu}<span>個</span>`;
    $('scenario-status').textContent=s.status;
    $('scenario-status').className='scenario-status '+(s.pending?'pending':'comparison');
    $('scenario-note').textContent=s.note;
    $('order-rows').innerHTML=['左','右'].map(side=>{
      const rest=s.common<5?`${5-s.common}枚は共通部品も未実装`:s.mcu<5?`${5-s.mcu}枚はマイコンのみ省略`:'全数に共通部品とマイコン';
      return `<tr><th scope="row">${side} / TOP</th><td>5枚</td><td>0枚</td><td>対象外</td><td>5枚とも部品なし</td></tr><tr><th scope="row">${side} / MAIN</th><td>5枚</td><td>5枚</td><td>対象外</td><td>全数に共通部品</td></tr><tr><th scope="row">${side} / BOTTOM</th><td>5枚</td><td>${s.common}枚</td><td>${s.mcu}枚に実装</td><td>${rest}</td></tr>`;
    }).join('');
    $('bottom-lots').innerHTML=['左','右'].map(side=>`<div class="lot-group"><h3>${side} BOTTOM / 5枚</h3><div class="lot-board-row">${Array.from({length:5},(_,i)=>`<div class="lot-board${i<s.common?' populated':''}"><span>${i+1}枚目</span><span>${i<s.common?'共通部品':'部品なし'}</span>${i<s.mcu?'<span class="module">XIAO</span>':'<span class="omitted">XIAOなし</span>'}</div>`).join('')}</div></div>`).join('');
  }
  $('order-scenario').addEventListener('change',render);render();
  $('copy-inquiry').addEventListener('click',async()=>{
    const field=$('inquiry-text');
    try{await navigator.clipboard.writeText(field.value);$('copy-status').textContent='確認文をコピーしました。送信は行っていません。';}
    catch{field.focus();field.select();$('copy-status').textContent='確認文を選択しました。コピー操作（Ctrl+Cなど）でコピーしてください。';}
  });
})();
