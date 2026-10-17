'use strict';
(() => {
 const screenNode = document.getElementById('screen');
 const experience = document.getElementById('experience');
 const qaScreen = document.getElementById('qa-screen');
 const qaState = document.getElementById('qa-state');
 const data = window.UX05_DATA;
 const params = new URLSearchParams(window.location.search);
 const requested = Number(params.get('step') || 1);
 let step = [1,2,3].includes(requested) ? requested - 1 : 0;
 let view = params.get('view') === 'results' ? 'results' : 'survey';
 let state = ['incomplete','ielts','few','empty'].includes(params.get('state')) ? params.get('state') : 'incomplete';
 const answers = {};
 if (state === 'ielts') { answers.exam = 'IELTS Academic'; answers.score = '5.5'; }
 const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const field = (name,label,placeholder='Можно пропустить') => `<label class="field">${label}<input name="${name}" value="${escape(answers[name])}" placeholder="${placeholder}" ${['score','grade','budget'].includes(name)?'inputmode="decimal"':''}></label>`;
 const select = (name,label,options) => `<label class="field">${label}<select name="${name}"><option value="">Пока не знаю</option>${options.map(x=>`<option ${answers[name]===x?'selected':''}>${escape(x)}</option>`).join('')}</select></label>`;
 function save(form) {
  for (const element of form.querySelectorAll('[name]')) {
   if (element.name === 'regions' || (element.type === 'radio' && !element.checked)) continue;
   answers[element.name] = element.value;
  }
  if (form.querySelector('[name="regions"]')) answers.regions = Array.from(form.querySelectorAll('[name="regions"]:checked'), el=>el.value);
  updateStory();
 }
 function updateStory() {
  const phase = view === 'results' ? 'results' : String(step);
  experience.dataset.phase = phase;
  const index = view === 'results' ? 3 : step;
  document.getElementById('story-label').textContent = ['Из интереса — в направление','Ваша отправная точка','Планы, которые вам по силам','От ответов — к следующему шагу'][index];
  document.getElementById('story-title').innerHTML = ['Не просто вуз.<br> Ваше место<br> в мире.','У каждого<br> свой путь.<br> И свой старт.','Большие планы.<br> Понятные<br> ориентиры.','Возможности.<br> С понятными<br> условиями.'][index];
  document.getElementById('story-description').textContent = ['Начните с того, что увлекает. Остальное найдём по пути.','Не нужно иметь все ответы. Расскажите только то, что знаете.','Учёба должна вписываться в ваши возможности. Без скрытых обещаний.','Изучите требования и пробелы, прежде чем выбирать программу.'][index];
  document.getElementById('story-marker').textContent = index === 3 ? '↗' : String(index+1).padStart(2,'0');
  const value = index === 0 ? answers.field : index === 1 ? [answers.exam, answers.score].filter(Boolean).join(' · ') : index === 2 ? [answers.budget,answers.currency].filter(Boolean).join(' ') : 'Уточнить. Сравнить. Решить.';
  document.getElementById('story-selection').textContent = value || 'Маршрут ещё открыт';
  for (const el of document.querySelectorAll('[data-step]')) { const n=Number(el.dataset.step);el.classList.toggle('done',view==='results'||n<step);if(view==='survey'&&n===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current'); }
 }
 function fields() {
  if (step === 0) {
   const directions = [['Бизнес','BS'],['Информационные технологии (IT)','IT'],['Компьютерная инженерия','CE'],['Программная инженерия','SE'],['Computer Science','CS'],['Другое направление','…']];
   return `<fieldset><legend>Что хотите изучать?</legend><div class="direction-grid">${directions.map(([name,code])=>`<label class="direction"><input type="radio" name="field" value="${escape(name)}" ${answers.field===name?'checked':''}><span class="direction-code" aria-hidden="true">${code}</span><span>${name}</span></label>`).join('')}</div><label class="unknown-choice"><input type="radio" name="field" value="" ${!answers.field?'checked':''}>Пока не определился(ась)</label></fieldset><fieldset><legend>Где рассматриваете учёбу?</legend><div class="regions">${['Европа','США','Южная Корея','Великобритания','Канада'].map(name=>`<label class="region"><input name="regions" value="${name}" type="checkbox" ${(answers.regions||[]).includes(name)?'checked':''}>${name}</label>`).join('')}</div><p class="help">Можно несколько. Не знаете — оставьте выбор открытым.</p></fieldset>`;
  }
  if (step === 1) return select('exam','Языковой экзамен',['Ещё не сдавал(а)','IELTS Academic','TOEFL iBT','TOPIK'])+`<div id="score-field" ${hasExam()?'':'hidden'}>${field('score','Ваш балл','Например, 5.5')}</div><details ${answers.grade||answers.scale?'open':''}><summary>Добавить школьные оценки — необязательно</summary><div class="pair">${field('grade','Средняя оценка')}${select('scale','Исходная шкала',['Из 4','Из 5','Из 100'])}</div><p class="help">Без шкалы оценку пока нельзя сравнить.</p></details>`;
  return `<div class="pair">${field('budget','Обучение за учебный год','Сумма без проживания')}${select('currency','Валюта',['EUR','USD','UZS','KRW','GBP','CAD'])}</div>${select('scholarship','Нужна ли стипендия?',['Без неё не смогу','Будет полезна','Не обязательна'])}<p class="help">Не вычитаем неподтверждённую стипендию и не смешиваем валюты.</p>`;
 }
 function hasExam() { return Boolean(answers.exam && answers.exam !== 'Ещё не сдавал(а)'); }
 function validate() {
  const limits = step === 1 ? {score:answers.exam==='IELTS Academic'?9:answers.exam==='TOPIK'?6:120,grade:answers.scale?Number(answers.scale.slice(3)):Infinity} : step===2?{budget:Infinity}:{};
  for (const [name,max] of Object.entries(limits)) {if(name==='score'&&!hasExam())continue;const raw=answers[name];if(raw==null||raw.trim()==='')continue;const value=Number(raw.replace(',','.'));if(!Number.isFinite(value)||value<0||value>max)return name;}
  return null;
 }
 function survey() {
  const titles=['Что вам интересно?','Что уже известно?','На что ориентироваться?'];
  screenNode.innerHTML=`<div class="screen-heading"><p class="step-caption">Шаг ${step+1} из 3</p><h2 id="question-title" tabindex="-1">${titles[step]}</h2><p>${['Выберите направление и регионы — без окончательных решений.','Укажите только то, что знаете о своей подготовке.','Бюджет на обучение за один учебный год.'][step]}</p></div><div id="form-error" role="alert" hidden></div><form id="survey-form" novalidate aria-labelledby="question-title"><div class="fields">${fields()}</div><div class="form-actions">${step?'<button class="button secondary" type="button" id="back">Назад</button>':'<span class="spacer"></span>'}<button class="button" type="submit" id="next">${step===2?'Посмотреть варианты':'Продолжить'}<span aria-hidden="true">↗</span></button></div><button class="skip" type="button" id="skip">Пока не знаю — пропустить</button></form>`;
  const form=document.getElementById('survey-form');
  const change=event=>{if(event.target.name==='exam'){answers.score='';const old=form.querySelector('[name="score"]');if(old)old.value='';}save(form);const score=document.getElementById('score-field');if(score)score.hidden=!hasExam();};
  form.addEventListener('change',change);form.addEventListener('input',event=>{if(event.target.name!=='exam')save(form);});
  form.addEventListener('submit',event=>{event.preventDefault();save(form);const invalid=validate();if(invalid){const message=document.getElementById('form-error');message.hidden=false;message.className='error';message.textContent='Проверьте значение и выбранную шкалу. Если не знаете — оставьте поле пустым.';const control=form.querySelector(`[name="${invalid}"]`);control.setAttribute('aria-invalid','true');control.classList.add('invalid');control.focus();return;}advance();});
  const back=document.getElementById('back');if(back)back.onclick=()=>{save(form);step--;render(true);};
  document.getElementById('skip').onclick=()=>{for(const name of [['field','regions'],['exam','score','grade','scale'],['budget','currency','scholarship']][step])delete answers[name];advance();};
 }
 function advance(){if(step<2)step++;else {view='results';state=answers.exam==='IELTS Academic'&&Number(String(answers.score).replace(',','.'))===5.5?'ielts':'incomplete';}render(true);}
 function program(row) {
  const unmet=state==='ielts'&&row.min>5.5;
  return `<article class="program"><div class="program-university">${escape(row.university)}<span class="program-country">${escape(row.country)}</span></div><h3>${escape(row.name)}</h3><span class="status ${unmet?'attention':''}">${unmet?'! Есть невыполненное условие':'? Поступление нужно уточнить'}</span><p class="reason">${unmet?`IELTS 5.5 ниже опубликованного порога ${row.min}.`:'Вуз должен проверить ваш школьный документ.'}</p><div class="price"><strong>${row.amount.toLocaleString('ru-RU')} ${row.currency}</strong><small>за ${row.period==='semester'?'семестр':'учебный год'}</small><small class="fee-year">${row.year||'Год тарифа не указан'} · только обучение</small></div><details><summary>Требования и официальные источники</summary><p>${row.min?`Опубликованный ориентир IELTS: ${row.min}. Секции, срок действия и освобождения требуют отдельной проверки.`:'Численный порог IELTS не установлен в исследованных материалах; это не означает освобождение от языка.'}</p><p>Признание документа, прямое поступление, набор и наличие мест не подтверждены. Проживание, прочие сборы и стипендии нужно уточнить.</p><p>${row.period==='semester'?'Цена за семестр не пересчитана в год. ':''}${row.year?'Опубликованный тариф не является персональным счётом.':'Нельзя автоматически отнести этот тариф к 2027 году.'}</p>${row.sources.map(source=>`<div class="source"><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a><p>Проверено в каталоге: ${escape(source.checkedAt)}. ${escape(source.scope)}</p></div>`).join('')}</details></article>`;
 }
 function results() {
  const list=state==='few'?data.slice(0,1):data;
  const ordinary=state==='ielts'?list.filter(row=>!(row.min>5.5)):list;
  const alternatives=state==='ielts'?list.filter(row=>row.min>5.5):[];
  screenNode.innerHTML=`<div class="screen-heading"><p class="step-caption">Результаты · образец</p><h2 id="question-title" tabindex="-1">Ваш следующий шаг</h2><p>Главное об условиях. Остальное — в подробностях.</p></div><div class="results-intro"><p>Композиция на трёх записях каталога.<br>Это не рассчитанный подбор и не рейтинг.</p><button class="button secondary" type="button" id="edit">Изменить ответы</button></div>${state==='empty'?'<section class="empty"><h3>Пока нет вариантов</h3><p>В проверенной части каталога нет программ под эти предпочтения. Это не означает, что их не существует. Не меняем условия автоматически.</p><button class="button" type="button" id="empty-edit">Изменить направление</button></section>':`<div class="program-list">${ordinary.map(program).join('')}</div>${alternatives.length?'<h3 class="results-section-title">Нужно выполнить условие</h3><p class="help">Отдельные варианты для уточнения: известный языковой порог не достигнут.</p><div class="program-list">'+alternatives.map(program).join('')+'</div>':''}<p class="help">В этом образце ${list.length} ${list.length===1?'вариант':'варианта'}. Список не дополняется вымышленными программами.</p>`}<details><summary>Уточнить подбор — необязательно</summary><form id="refine-form" class="fields" novalidate><div class="pair">${field('schoolCountry','Страна школьного образования')}${field('credential','Школьный документ')}</div><div class="pair">${field('startYear','Год начала учёбы')}${select('language','Язык',['Английский','Корейский','Другой'])}</div>${hasExam()?field('examDate','Дата экзамена'):''}<button class="button secondary" type="submit">Оставить уточнения в образце</button><p class="refine-status" id="refine-status" aria-live="polite"></p></form></details><p class="help">Следующий шаг: проверить неизвестные условия на официальной странице программы.</p>`;
  const edit=()=>{view='survey';step=0;render(true);};document.getElementById('edit').onclick=edit;const empty=document.getElementById('empty-edit');if(empty)empty.onclick=edit;
  document.getElementById('refine-form').onsubmit=event=>{event.preventDefault();save(event.currentTarget);document.getElementById('refine-status').textContent='Уточнения оставлены в открытом образце. Реальный подбор не пересчитан.';};
 }
 function render(focus=false){updateStory();if(view==='survey')survey();else results();qaScreen.value=view==='results'?'results':String(step);qaState.value=state;if(focus)document.getElementById('question-title').focus({preventScroll:false});}
 document.getElementById('qa-apply').onclick=()=>{const form=document.getElementById('survey-form');if(form)save(form);state=qaState.value;view=qaScreen.value==='results'?'results':'survey';if(view==='survey')step=Number(qaScreen.value);if(state==='ielts'){answers.exam='IELTS Academic';answers.score='5.5';}render(true);};
 render();
})();
