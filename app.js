'use strict';
const $=id=>document.getElementById(id);
const el=(tag,content,cls)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n;};
const published=cases.filter(c=>!c.draft);
const person=id=>members.find(m=>m.id===id)?.name||'담당자 미지정';
function button(label,fn){const b=el('button',label);b.addEventListener('click',fn);return b;}
function renderText(value){
  const content=document.createDocumentFragment();
  const lines=String(value).split(/\r?\n/);
  const cells=line=>line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell=>cell.trim());
  const isRow=line=>line!==undefined&&/^\s*\|.*\|\s*$/.test(line);
  const isDivider=line=>isRow(line)&&cells(line).every(cell=>/^:?-{3,}:?$/.test(cell));
  let text=[];
  const flush=()=>{if(text.join('\n').trim())content.append(el('p',text.join('\n')));text=[];};
  for(let i=0;i<lines.length;i++){
    if(!isRow(lines[i])||!isDivider(lines[i+1])){text.push(lines[i]);continue;}
    flush();
    const headers=cells(lines[i]),alignments=cells(lines[i+1]);
    const wrapper=el('div',undefined,'table-scroll');
    wrapper.tabIndex=0;wrapper.setAttribute('role','region');
    const table=el('table',undefined,'content-table'),head=el('thead'),body=el('tbody');
    const row=(values,header=false)=>{
      const tr=el('tr');
      for(let column=0;column<headers.length;column++){
        const cell=el(header?'th':'td',values[column]||'');
        if(header)cell.scope='col';
        const alignment=alignments[column]||'';
        cell.style.textAlign=alignment.endsWith(':')?(alignment.startsWith(':')?'center':'right'):'left';
        tr.append(cell);
      }
      return tr;
    };
    wrapper.setAttribute('aria-label',headers.join(' / '));
    head.append(row(headers,true));i+=2;
    while(i<lines.length&&isRow(lines[i])&&!isDivider(lines[i])){body.append(row(cells(lines[i])));i++;}
    i--;table.append(head,body);wrapper.append(table);content.append(wrapper);
  }
  flush();return content;
}
const memberCases=id=>published.filter(c=>c.memberId===id);
const representative=id=>{const records=memberCases(id);return records.find(c=>c.featured)||records[0];};
for(const [n,label] of [[members.length,'개발자'],[published.length,'트러블슈팅']]){
  const d=el('div');d.append(el('strong',n),el('span',label));$('stats').append(d);
}
for(const [i,m] of members.entries()){
  const records=memberCases(m.id), featured=representative(m.id);
  const card=button('',()=>showMember(m.id));
  card.className='member-card';
  card.setAttribute('aria-label',m.name+'의 트러블슈팅 '+records.length+'개 보기');
  const heading=el('span',undefined,'member-heading');
  heading.append(el('span',String(i+1).padStart(2,'0'),'avatar'),el('span',m.name,'member-name'),el('span',m.role,'tag'));
  card.append(heading,el('span',m.tasks,'member-tasks'),el('span',featured?'대표 트러블슈팅':'대표 기록 준비 중','record-label'));
  if(featured){
    card.append(el('span',featured.title,'record-title'),el('span',featured.tags.join(' / '),'tag'));
    for(const [label,value] of [['문제',featured.symptoms||featured.background],['해결',featured.summary||featured.decision]]){
      const line=el('span',undefined,'record-summary');line.append(el('strong',label),el('span',value||'내용 작성 중'));card.append(line);
    }
  }else{
    card.append(el('span','트러블슈팅 기록을 정리하고 있습니다.','record-title'),el('span','공개된 기록이 등록되면 이곳에서 확인할 수 있습니다.','member-tasks'));
  }
  card.append(el('span',records.length?'전체 '+records.length+'개 기록 보기 →':'기록 준비 현황 보기 →','card-action'));
  $('members').append(card);
}
function showMember(id){
  const m=members.find(m=>m.id===id),records=memberCases(id),featured=representative(id);
  openArticle(m.name+'의 트러블슈팅');
  const article=$('article');article.append(el('p',m.tasks,'member-tasks'));
  if(!records.length){article.append(el('p','아직 공개된 트러블슈팅 기록이 없습니다.','empty'));return;}
  article.append(el('p','총 '+records.length+'개의 기록 · 기록을 선택하면 전체 내용을 볼 수 있습니다.'));
  const list=el('div',undefined,'record-list');
  for(const c of [featured,...records.filter(c=>c!==featured)]){
    const item=button('',()=>showCase(c));item.className='record-link';
    item.append(el('span',c===featured?'대표 기록':c.category,'tag'),el('span',c.title,'record-title'),el('span',(c.summary||c.decision||c.background||'내용 보기'),'record-excerpt'));
    list.append(item);
  }
  article.append(list);
}
function openArticle(title){const heading=el('h1',title);heading.id='detail-title';$('article').replaceChildren(heading);if(!$('detail').open)$('detail').showModal();$('detail').scrollTop=0;}
function showCase(c){openArticle(c.title);const a=$('article');a.prepend(button('← '+person(c.memberId)+'의 전체 기록',()=>showMember(c.memberId)));a.append(el('p',c.category+' · '+c.tags.join(', '),'tag'));const sections=[['1. 문제 발생 배경',c.background],['2. 실제 발생한 오류 및 증상',c.symptoms],['3. 원인 분석 과정',c.analysis],['4. 해결 방법 및 대안 비교',c.alternatives],['5. 최종 기술 선택 이유',c.decision]];for(const [t,v] of sections)a.append(el('h3',t),renderText(v||'미작성'));a.append(el('h3','6. 변경 전·후 코드'),el('h4','Before'),el('pre',c.beforeCode||'해당 없음'),el('h4','After'),el('pre',c.afterCode||'해당 없음'),el('h3','7. 테스트 및 검증 결과'),renderText(c.verification||'미작성'),el('h3','8. 기술적 한계 및 개선 방향'),renderText(c.limitations||'미작성'),el('h3','9. 담당 개발자'),el('p',person(c.memberId)));}
$('close').addEventListener('click',()=>$('detail').close());$('detail').addEventListener('click',e=>{if(e.target===$('detail'))$('detail').close();});
let theme='light';try{theme=localStorage.getItem('devlog-theme')|| (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}catch{}document.documentElement.dataset.theme=theme;$('theme').addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('devlog-theme',theme);}catch{}});
