'use strict';
const $=id=>document.getElementById(id);
const el=(tag,content,cls)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n;};
const published=cases.filter(c=>!c.draft);
const person=id=>members.find(m=>m.id===id)?.name||'담당자 미지정';
function button(label,fn){const b=el('button',label);b.addEventListener('click',fn);return b;}
const memberCases=id=>published.filter(c=>c.memberId===id);
const representative=id=>{const records=memberCases(id);return records.find(c=>c.featured)||records[0];};
for(const [n,label] of [[members.length,'개발자'],[published.length,'트러블슈팅']]){
  const d=el('div');d.append(el('strong',n),el('span',label));$('stats').append(d);
}
function renderRecords(id = null) {
  const member = members.find(m => m.id === id);
  const records = id ? memberCases(id) : published;
  $('list-title').textContent = member ? member.name + '의 기록' : '전체 기록';
  $('count').textContent = records.length + '개 기록';
  $('member-description').hidden = !member;
  $('member-description').textContent = member ? member.tasks : '';
  for (const filter of $('members').children) {
    filter.setAttribute('aria-pressed', String(filter.dataset.member === (id || 'all')));
  }
  $('records').replaceChildren();
  if (!records.length) {
    $('records').append(el('p', '아직 공개된 기록이 없습니다. 정리된 트러블슈팅이 이곳에 표시됩니다.', 'empty'));
    return;
  }
  for (const c of records) {
    const item = button('', () => showCase(c));
    item.className = 'record-link';
    const meta = el('span', undefined, 'record-meta');
    meta.append(el('span', c.category, 'tag'), el('span', person(c.memberId)));
    if (c.featured) meta.append(el('span', '대표 기록', 'featured'));
    item.append(meta, el('span', c.title, 'record-title'), el('span', c.summary || c.decision || c.background, 'record-excerpt'));
    const bottom = el('span', undefined, 'record-bottom');
    bottom.append(el('span', c.tags.join(' / ')), el('span', '기록 읽기 →', 'read-action'));
    item.append(bottom);
    $('records').append(item);
  }
}
for (const member of [null, ...members]) {
  const filter = button('', () => renderRecords(member?.id || null));
  filter.className = 'member-filter';
  filter.dataset.member = member?.id || 'all';
  filter.append(el('span', member?.name || '전체 기록'), el('span', String(member ? memberCases(member.id).length : published.length), 'filter-count'));
  if (member) filter.append(el('span', member.role, 'member-role'));
  $('members').append(filter);
}
renderRecords();
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
function showCase(c){openArticle(c.title);const a=$('article');a.prepend(button('← '+person(c.memberId)+'의 전체 기록',()=>showMember(c.memberId)));a.append(el('p',c.category+' · '+c.tags.join(', '),'tag'));const sections=[['1. 문제 발생 배경',c.background],['2. 실제 발생한 오류 및 증상',c.symptoms],['3. 원인 분석 과정',c.analysis],['4. 해결 방법 및 대안 비교',c.alternatives],['5. 최종 기술 선택 이유',c.decision]];for(const [t,v] of sections)a.append(el('h3',t),el('p',v||'미작성'));a.append(el('h3','6. 변경 전·후 코드'),el('h4','Before'),el('pre',c.beforeCode||'해당 없음'),el('h4','After'),el('pre',c.afterCode||'해당 없음'),el('h3','7. 테스트 및 검증 결과'),el('p',c.verification||'미작성'),el('h3','8. 기술적 한계 및 개선 방향'),el('p',c.limitations||'미작성'),el('h3','9. 관련 Issue·PR·Commit'));let valid=0;for(const l of c.links||[]){try{const u=new URL(l.url);if(!['https:','http:'].includes(u.protocol))continue;const link=el('a',l.label);link.href=u.href;link.target='_blank';link.rel='noopener noreferrer';const p=el('p');p.append(link);a.append(p);valid++;}catch{}}if(!valid)a.append(el('p','등록된 링크 없음'));a.append(el('h3','10. 담당 개발자'),el('p',person(c.memberId)));}
$('close').addEventListener('click',()=>$('detail').close());$('detail').addEventListener('click',e=>{if(e.target===$('detail'))$('detail').close();});
