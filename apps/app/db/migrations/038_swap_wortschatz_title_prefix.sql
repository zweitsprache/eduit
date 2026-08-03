update worksheets
set title = substring(title from 19) || ' | Basiswortschatz'
where title like 'Basiswortschatz | %';

update worksheets
set title = substring(title from 20) || ' | Aufbauwortschatz'
where title like 'Aufbauwortschatz | %';
