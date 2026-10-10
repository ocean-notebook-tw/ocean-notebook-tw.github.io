const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NAME_KEY = 'oss-student-name';
function getName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } }
function setName(v) { try { localStorage.setItem(NAME_KEY, v); } catch (e) { } }
