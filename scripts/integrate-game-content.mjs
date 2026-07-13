import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(root, '..', 'index.html');
const poolPath = join(root, 'millionaire-pool.js');
const storiesPath = join(root, 'story-data-new.js');

let html = readFileSync(htmlPath, 'utf8');
const pool = readFileSync(poolPath, 'utf8').trim();
const stories = readFileSync(storiesPath, 'utf8').trim();

if (!html.includes('const MILLIONAIRE_POOL')) {
  html = html.replace('const MILLIONAIRE_LADDER', `${pool}\nconst MILLIONAIRE_LADDER`);
}

if (!html.includes('id:"cleopatra"')) {
  const anchor = 'react:"You saved Flavortown IT, baby! This rig\'s certified money!"}\n]}\n];\nconst MILLIONAIRE_LADDER';
  const anchorAlt = 'react:"You saved Flavortown IT, baby! This rig\'s certified money!"}\n]}\n];\nconst MILLIONAIRE_POOL';
  const insert = `react:"You saved Flavortown IT, baby! This rig's certified money!"}\n]},\n${stories}\n];\nconst MILLIONAIRE_LADDER`;
  if (html.includes(anchor)) html = html.replace(anchor, insert);
  else if (html.includes(anchorAlt)) html = html.replace(anchorAlt, insert.replace('const MILLIONAIRE_LADDER', 'const MILLIONAIRE_POOL'));
  else throw new Error('STORY_DATA end anchor not found');
}

const oldBlock = `function collectQuizPool(){
  const pool = [];
  for(const d of DOMAINS){
    for(const s of d.subs) pool.push(...s.quiz);
    if(d.mock) pool.push(...d.mock);
  }
  return pool;
}
function buildMillionaireGame(){
  const pool = collectQuizPool();
  const qs = shuffle(pool).slice(0, 15).map(q=>{
    const opts = q.o.map((t,i)=>({t, correct:i===q.a}));
    return {q:q.q, opts:shuffle(opts), ex:q.e};
  });
  return {id:"millionaire", type:"millionaire", mode:"normal", phase:"play",
    qs, i:0, safePrize:0, finalPrize:0, done:false, lost:false, won:false, walked:false,
    answered:false, picked:null, pending:null, mistakes:0,
    hostMsg:hostBanter(MILLIONAIRE_HOST.question[0]),
    lifelines:{fifty:false, phone:false, audience:false},
    hidden:new Set(), phoneMsg:"", audiencePct:null};
}`;

const newBlock = `function prepMillionaireQ(q){
  const opts = q.o.map((t,i)=>({t, correct:i===q.a}));
  return {q:q.q, opts:shuffle(opts), ex:q.e};
}
function pickMillionaireTier(pool, n){
  return shuffle(pool).slice(0, n).map(prepMillionaireQ);
}
function buildMillionaireGame(){
  const qs = [
    ...pickMillionaireTier(MILLIONAIRE_POOL.warmup, 5),
    ...pickMillionaireTier(MILLIONAIRE_POOL.mid, 5),
    ...pickMillionaireTier(MILLIONAIRE_POOL.high, 5)
  ];
  return {id:"millionaire", type:"millionaire", mode:"normal", phase:"play",
    qs, i:0, safePrize:0, finalPrize:0, done:false, lost:false, won:false, walked:false,
    answered:false, picked:null, pending:null, mistakes:0,
    hostMsg:hostBanter(MILLIONAIRE_HOST.question[0]),
    lifelines:{fifty:false, phone:false, audience:false},
    hidden:new Set(), phoneMsg:"", audiencePct:null};
}`;

if (!html.includes('function prepMillionaireQ')) {
  if (!html.includes(oldBlock)) throw new Error('buildMillionaireGame block not found');
  html = html.replace(oldBlock, newBlock);
}

html = html.replace(
  '<p class="sub">Five tech rescues, five personalities. Tap a character to start their story.</p>',
  '<p class="sub">${STORY_DATA.length} tech rescues, ${STORY_DATA.length} personalities. Tap a character to start their story.</p>'
);

writeFileSync(htmlPath, html);
console.log('Integrated game content into index.html');
