import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(([,attrs])=>!attrs.includes('src='))[2].replace(/\binit\(\);\s*$/, '');
function app(){
  const nodes = new Map();
  const node = id => {
    if(!nodes.has(id)) nodes.set(id,{textContent:'',innerHTML:'',value:'',className:'',classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return []},replaceWith(n){this.replacement=n},focus(){},reportValidity(){return true}});
    return nodes.get(id);
  };
  const document={getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],createElement:()=>({}),body:{setAttribute(){}}};
  ['toast','main','sidebar','themeBtn','roleSwitch'].forEach(node);
  const context=vm.createContext({console,document,window:{},localStorage:{getItem(){return null},setItem(k,v){context.saved=v}},setTimeout:()=>1,clearTimeout(){},FormData:class{constructor(form){return form.data}},confirm:()=>true,prompt:()=>null,URL,Blob});
  vm.runInContext(script,context);
  return {context,node,run:code=>vm.runInContext(code,context)};
}
const student=`({id:'s1',name:'Ana',age:30,level:'iniciante',goal:'5k',freq:3,availableDays:['Ter','Qui','Dom'],recentVolumeKm:12,recentLongestKm:4})`;
test('time input rejects malformed seconds and formatting carries the minute',()=>{
  const a=app();
  assert.equal(a.run('parseTimeStr("12:99")'),null);
  assert.equal(a.run('parseTimeStr("1:60:00")'),null);
  assert.equal(a.run('parseTimeStr("1:02:03")'),3723);
  assert.equal(a.run('parsePaceToSec("6:60")'),null);
  assert.equal(a.run('parsePaceToSec("-2:10")'),null);
  assert.equal(a.run('fmtPace(359.8)'), '6:00/km');
  assert.equal(a.run('secToTimeStr(359.8)'), '6:00');
});
test('partial stored data gets safe defaults and writes immediately',()=>{
  const a=app();
  assert.equal(a.run('normalizeDB({students:{}}).config.role'),'aluno');
  assert.throws(()=>a.run('normalizeDB(null)'));
  a.run('saveDB()'); assert.ok(a.context.saved.includes('students'));
});
test('active plans exclude templates and select latest real plan',()=>{
  const a=app();a.run(`DB.students.s1=${student};DB.config.activeStudentId='s1';DB.plans={old:{id:'old',studentId:'s1'},new:{id:'new',studentId:'s1'},template:{id:'t',studentId:'s1',isTemplate:true}}`);
  assert.equal(a.run('currentPlan().id'),'new');
});
test('all goals and frequencies generate finite volumes and unique valid days',()=>{
  const a=app();
  for(const goal of ['adaptacao','5k','10k','15k','21k'])for(const freq of [2,3,4])for(const level of ['iniciante','intermediario','avancado']){
    a.run(`globalThis.p=generatePlan({...${student},goal:${JSON.stringify(goal)},freq:${freq},level:${JSON.stringify(level)},availableDays:['Dom','Ter','Ter','inválido','Qui','Sáb']})`);
    assert.ok(a.run(`p.weeks.every(w=>w.sessions.length===${freq} && new Set(w.sessions.map(s=>s.day)).size===${freq} && w.sessions.every(s=>WEEKDAY_CANON_ORDER.includes(s.day)) && Number.isFinite(w.totalKm))`));
  }
  a.run(`globalThis.p=generatePlan(${student})`);
  assert.equal(a.run('p.weeks[0].sessions.find(s=>s.name.includes("Longão")).day'),'Dom');
});
test('new trainer registration never overwrites the focused student',()=>{
  const a=app();const form=a.node('formAvaliacao');form.data=new Map(Object.entries({name:'Beatriz',age:'28',goal:'5k',level:'iniciante',freq:'3',days:'Ter, Qui, Dom'}));
  a.run(`DB.students.s1=${student};DB.config.activeStudentId='s1';DB.config.role='treinador';UI.view='novo_aluno';bindViewEvents()`);
  form.onsubmit({preventDefault(){}});
  assert.equal(a.run('DB.students.s1.name'),'Ana');
  assert.equal(a.run('Object.values(DB.students).length'),2);
});
test('user text is escaped in editing, calendar, print and pace views',()=>{
  const a=app();a.run(`DB.students.s1={...${student},name:'<img src=x onerror=alert(1)>'};DB.config.activeStudentId='s1';globalThis.p=generatePlan(DB.students.s1);p.published=true;DB.plans[p.id]=p;p.weeks[0].sessions[0].notes='</textarea><script>alert(1)</script>'`);
  for(const expr of ['viewEditarAluno()','viewCalendarioAluno(currentStudent())','viewPlanoTreinador()','buildPrintHTML(currentStudent(), currentPlan())','viewRitmoEstimado(currentStudent())']){
    const out=a.run(expr); assert.ok(!out.includes('<img src=x'));assert.ok(!out.includes('<script>alert(1)'));
  }
});
test('week selection normalizes before adding a session and move buttons retain manual order',()=>{
  const a=app();a.run(`DB.students.s1=${student};DB.config.activeStudentId='s1';globalThis.p=generatePlan(DB.students.s1);DB.plans[p.id]=p;UI.week=99;viewPlanoTreinador()`);
  assert.equal(a.run('UI.week'),1);
  a.run('p.weeks[0].sessions.reverse()');
  const out=a.run('viewPlanoTreinador()');
  const ids=a.run('p.weeks[0].sessions.map(s=>s.id)');assert.ok(out.indexOf('data-ses="'+ids[0]+'"')<out.indexOf('data-ses="'+ids[1]+'"'));
});
test('missing chart dependency displays a fallback instead of throwing',()=>{
  const a=app();const canvas=a.node('chartVolume');
  a.run('chartOrNone("chartVolume","bar",{})');assert.match(canvas.replacement.textContent,/indisponível/);
});
test('empty log values stay null; invalid numeric entries do not mutate logs',()=>{
  const a=app();const button={dataset:{save:'ses1'}};
  a.node('main').querySelectorAll=selector=>selector==='[data-save]'?[button]:[];
  for(const prefix of ['d_','du_','hr_','rpe_','pain_','fat_','sleep_','sat_','p_','notes_'])a.node(prefix+'ses1');
  a.run(`DB.students.s1=${student};DB.config.activeStudentId='s1';bindViewEvents()`);
  a.node('rpe_ses1').value='11';button.onclick();assert.equal(a.run('Object.keys(DB.logs).length'),0);
  a.node('rpe_ses1').value='';button.onclick();assert.equal(a.run('Object.values(DB.logs)[0].rpe'),null);
});
